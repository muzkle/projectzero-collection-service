import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ErrorCode, WishlistItemDto } from '@projectzero/contracts';
import { WishlistItem } from './entities/wishlist-item.entity';
import { StickerRef } from '../stickers/entities/sticker-ref.entity';
import { UserSticker } from '../stickers/entities/user-sticker.entity';
import { DomainException } from '../../common/exceptions/domain.exception';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private wishlist: Repository<WishlistItem>,
    @InjectRepository(StickerRef)
    private stickerRefs: Repository<StickerRef>,
    @InjectRepository(UserSticker)
    private userStickers: Repository<UserSticker>,
  ) {}

  async list(userId: string): Promise<WishlistItemDto[]> {
    const items = await this.wishlist.find({
      where: { userId },
      order: { addedAt: 'DESC' },
    });

    const stickerIds = items.map((item) => item.stickerId);
    const refs =
      stickerIds.length > 0
        ? await this.stickerRefs.find({ where: { id: In(stickerIds) } })
        : [];
    const refMap = new Map(refs.map((ref) => [ref.id, ref]));

    return items.map((item) => ({
      userId: item.userId,
      stickerId: item.stickerId,
      addedAt: item.addedAt.toISOString(),
      sticker: refMap.has(item.stickerId)
        ? {
            id: refMap.get(item.stickerId)!.id,
            albumId: refMap.get(item.stickerId)!.albumId,
            partnerId: refMap.get(item.stickerId)!.partnerId,
            name: refMap.get(item.stickerId)!.name,
            imageUrl: refMap.get(item.stickerId)!.imageUrl,
            rarity: refMap.get(item.stickerId)!.rarity,
            priceCents: refMap.get(item.stickerId)!.priceCents,
          }
        : undefined,
    }));
  }

  async add(userId: string, stickerId: string): Promise<WishlistItemDto> {
    const ref = await this.stickerRefs.findOne({ where: { id: stickerId } });
    if (!ref) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Sticker not found', 404);
    }

    const owned = await this.userStickers.exists({ where: { userId, stickerId } });
    if (owned) {
      throw new DomainException(ErrorCode.ALREADY_OWNED, 'Sticker already owned');
    }

    const existing = await this.wishlist.findOne({ where: { userId, stickerId } });
    if (existing) {
      return {
        userId: existing.userId,
        stickerId: existing.stickerId,
        addedAt: existing.addedAt.toISOString(),
        sticker: {
          id: ref.id,
          albumId: ref.albumId,
          partnerId: ref.partnerId,
          name: ref.name,
          imageUrl: ref.imageUrl,
          rarity: ref.rarity,
          priceCents: ref.priceCents,
        },
      };
    }

    const item = this.wishlist.create({ userId, stickerId });
    const saved = await this.wishlist.save(item);

    return {
      userId: saved.userId,
      stickerId: saved.stickerId,
      addedAt: saved.addedAt.toISOString(),
      sticker: {
        id: ref.id,
        albumId: ref.albumId,
        partnerId: ref.partnerId,
        name: ref.name,
        imageUrl: ref.imageUrl,
        rarity: ref.rarity,
        priceCents: ref.priceCents,
      },
    };
  }

  async remove(userId: string, stickerId: string): Promise<{ removed: boolean }> {
    const result = await this.wishlist.delete({ userId, stickerId });
    return { removed: (result.affected ?? 0) > 0 };
  }
}
