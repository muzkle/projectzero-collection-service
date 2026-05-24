import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AlbumProgressDto,
  ProfileDto,
  RankingEntryDto,
  Rarity,
  UserStickerDto,
} from '@muzkle/contracts';
import { UserSticker } from '../stickers/entities/user-sticker.entity';
import { StickerRef } from '../stickers/entities/sticker-ref.entity';
import { IdentityClient } from '../../infrastructure/clients/identity.client';
import { scoreForRarity } from '../../common/utils/ranking.util';

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(UserSticker)
    private userStickers: Repository<UserSticker>,
    @InjectRepository(StickerRef)
    private stickerRefs: Repository<StickerRef>,
    private identity: IdentityClient,
  ) {}

  async getCollection(userId: string): Promise<UserStickerDto[]> {
    const stickers = await this.userStickers.find({
      where: { userId },
      order: { acquiredAt: 'DESC' },
    });

    const stickerIds = [...new Set(stickers.map((s) => s.stickerId))];
    const refs =
      stickerIds.length > 0
        ? await this.stickerRefs.find({ where: { id: In(stickerIds) } })
        : [];
    const refMap = new Map(refs.map((ref) => [ref.id, ref]));

    return stickers.map((sticker) => ({
      id: sticker.id,
      userId: sticker.userId,
      stickerId: sticker.stickerId,
      serialNumber: sticker.serialNumber,
      acquiredVia: sticker.acquiredVia,
      acquiredAt: sticker.acquiredAt.toISOString(),
      sticker: refMap.has(sticker.stickerId)
        ? {
            id: refMap.get(sticker.stickerId)!.id,
            albumId: refMap.get(sticker.stickerId)!.albumId,
            partnerId: refMap.get(sticker.stickerId)!.partnerId,
            name: refMap.get(sticker.stickerId)!.name,
            imageUrl: refMap.get(sticker.stickerId)!.imageUrl,
            rarity: refMap.get(sticker.stickerId)!.rarity,
            priceCents: refMap.get(sticker.stickerId)!.priceCents,
          }
        : undefined,
    }));
  }

  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.identity.getUser(userId);
    const collection = await this.getCollection(userId);
    const recentStickers = collection.slice(0, 12);
    const albumProgress = await this.buildAlbumProgress(collection);
    const legendaryCount = collection.filter(
      (item) => item.sticker?.rarity === Rarity.LEGENDARY,
    ).length;

    return {
      user: {
        id: user!.id,
        displayName: user!.displayName,
        avatarUrl: user!.avatarUrl,
      },
      recentStickers,
      albumProgress,
      stats: {
        totalStickers: collection.length,
        legendaryCount,
      },
    };
  }

  async getRanking(albumId: string): Promise<RankingEntryDto[]> {
    const refs = await this.stickerRefs.find({ where: { albumId } });
    if (refs.length === 0) return [];

    const stickerIds = refs.map((ref) => ref.id);
    const rarityBySticker = new Map(refs.map((ref) => [ref.id, ref.rarity]));

    const rows = await this.userStickers
      .createQueryBuilder('us')
      .select('us.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('us.stickerId IN (:...stickerIds)', { stickerIds })
      .groupBy('us.userId')
      .getRawMany<{ userId: string; count: string }>();

    const scores: { userId: string; score: number }[] = [];
    for (const row of rows) {
      const owned = await this.userStickers.find({
        where: { userId: row.userId },
      });
      const albumOwned = owned.filter((item) => stickerIds.includes(item.stickerId));
      const score = albumOwned.reduce(
        (sum, item) => sum + scoreForRarity(rarityBySticker.get(item.stickerId)!),
        0,
      );
      scores.push({ userId: row.userId, score });
    }

    scores.sort((a, b) => b.score - a.score);

    const entries: RankingEntryDto[] = [];
    for (let i = 0; i < scores.length; i++) {
      const entry = scores[i];
      const user = await this.identity.getUser(entry.userId);
      entries.push({
        userId: entry.userId,
        displayName: user?.displayName ?? 'Collector',
        score: entry.score,
        rank: i + 1,
      });
    }

    return entries;
  }

  private async buildAlbumProgress(collection: UserStickerDto[]): Promise<AlbumProgressDto[]> {
    const albumIds = [
      ...new Set(collection.map((item) => item.sticker?.albumId).filter(Boolean) as string[]),
    ];

    const progress: AlbumProgressDto[] = [];
    for (const albumId of albumIds) {
      const albumRefs = await this.stickerRefs.find({ where: { albumId } });
      const owned = collection.filter((item) => item.sticker?.albumId === albumId).length;
      const total = albumRefs.length;
      progress.push({
        albumId,
        albumTitle: albumRefs[0]?.name ?? albumId,
        owned,
        total,
        percentage: total > 0 ? Math.round((owned / total) * 100) : 0,
      });
    }

    return progress;
  }
}
