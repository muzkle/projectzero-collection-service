import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AcquiredVia, ErrorCode } from '@muzkle/contracts';
import { UserSticker } from '../stickers/entities/user-sticker.entity';
import { StickerRef } from '../stickers/entities/sticker-ref.entity';
import { CatalogClient } from '../../infrastructure/clients/catalog.client';
import { DomainException } from '../../common/exceptions/domain.exception';

export interface MintResult {
  userSticker: UserSticker;
  created: boolean;
}

@Injectable()
export class MintService {
  constructor(
    @InjectRepository(UserSticker)
    private userStickers: Repository<UserSticker>,
    @InjectRepository(StickerRef)
    private stickerRefs: Repository<StickerRef>,
    private catalog: CatalogClient,
    private dataSource: DataSource,
  ) {}

  async mint(params: {
    userId: string;
    stickerId: string;
    acquiredVia: AcquiredVia;
    purchaseId?: string;
  }): Promise<MintResult> {
    if (params.purchaseId) {
      const existing = await this.userStickers.findOne({
        where: { purchaseId: params.purchaseId },
      });
      if (existing) {
        return { userSticker: existing, created: false };
      }
    }

    const owned = await this.userStickers.findOne({
      where: { userId: params.userId, stickerId: params.stickerId },
    });
    if (owned) {
      throw new DomainException(ErrorCode.ALREADY_OWNED, 'Sticker already owned');
    }

    const ref = await this.stickerRefs.findOne({ where: { id: params.stickerId } });
    if (!ref) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Sticker not found', 404);
    }

    const supply = await this.catalog.getSupply(params.stickerId);
    if (supply.supplyTotal != null && supply.supplyMinted >= supply.supplyTotal) {
      throw new DomainException(ErrorCode.SUPPLY_EXCEEDED, 'Sticker supply exceeded');
    }

    return this.dataSource.transaction(async (manager) => {
      const stickerRepo = manager.getRepository(UserSticker);

      const duplicate = await stickerRepo.findOne({
        where: { userId: params.userId, stickerId: params.stickerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (duplicate) {
        throw new DomainException(ErrorCode.ALREADY_OWNED, 'Sticker already owned');
      }

      const maxSerial = await stickerRepo
        .createQueryBuilder('us')
        .select('COALESCE(MAX(us.serialNumber), 0)', 'max')
        .where('us.stickerId = :stickerId', { stickerId: params.stickerId })
        .setLock('pessimistic_write')
        .getRawOne<{ max: string }>();

      const serialNumber = Number(maxSerial?.max ?? 0) + 1;

      const userSticker = stickerRepo.create({
        userId: params.userId,
        stickerId: params.stickerId,
        serialNumber,
        acquiredVia: params.acquiredVia,
        purchaseId: params.purchaseId ?? null,
      });
      await stickerRepo.save(userSticker);

      await this.catalog.incrementSupply(params.stickerId);

      return { userSticker, created: true };
    });
  }

  async isOwned(userId: string, stickerId: string): Promise<boolean> {
    const count = await this.userStickers.count({ where: { userId, stickerId } });
    return count > 0;
  }
}
