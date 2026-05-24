import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AcquiredVia,
  ErrorCode,
  MissionProgressDto,
  UserStickerDto,
} from '@projectzero/contracts';
import { StickerRef } from './entities/sticker-ref.entity';
import { UserSticker } from './entities/user-sticker.entity';
import { MissionProgress } from '../missions/entities/mission-progress.entity';
import { MintService } from '../mint/mint.service';
import { EligibilityService } from './eligibility.service';
import { DomainException } from '../../common/exceptions/domain.exception';

@Injectable()
export class StickersService {
  constructor(
    @InjectRepository(StickerRef)
    private stickerRefs: Repository<StickerRef>,
    @InjectRepository(MissionProgress)
    private missionProgress: Repository<MissionProgress>,
    private mintService: MintService,
    private eligibilityService: EligibilityService,
  ) {}

  async claim(userId: string, stickerId: string): Promise<UserStickerDto> {
    const ref = await this.stickerRefs.findOne({ where: { id: stickerId } });
    if (!ref) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Sticker not found', 404);
    }

    if (ref.priceCents > 0) {
      throw new DomainException(ErrorCode.PAYMENT_FAILED, 'Sticker is not free');
    }

    const eligibility = await this.eligibilityService.getEligibility(userId, stickerId);
    if (!eligibility.eligible) {
      throw new DomainException(
        ErrorCode.MISSION_NOT_COMPLETED,
        eligibility.reason ?? 'Not eligible to claim',
      );
    }

    const acquiredVia = eligibility.missionCompleted ? AcquiredVia.MISSION : AcquiredVia.GRANT;
    const { userSticker } = await this.mintService.mint({
      userId,
      stickerId,
      acquiredVia,
    });

    return this.toUserStickerDto(userSticker, ref);
  }

  getEligibility(userId: string, stickerId: string) {
    return this.eligibilityService.getEligibility(userId, stickerId);
  }

  async getMissionProgress(userId: string, stickerId: string): Promise<MissionProgressDto[]> {
    const rows = await this.missionProgress.find({ where: { userId, stickerId } });
    return rows.map((row) => ({
      userId: row.userId,
      missionId: row.missionId,
      stickerId: row.stickerId,
      progress: row.progress,
      completedAt: row.completedAt?.toISOString(),
      eligible: row.eligible,
    }));
  }

  toUserStickerDto(sticker: UserSticker, ref?: StickerRef | null): UserStickerDto {
    return {
      id: sticker.id,
      userId: sticker.userId,
      stickerId: sticker.stickerId,
      serialNumber: sticker.serialNumber,
      acquiredVia: sticker.acquiredVia,
      acquiredAt: sticker.acquiredAt.toISOString(),
      sticker: ref
        ? {
            id: ref.id,
            albumId: ref.albumId,
            partnerId: ref.partnerId,
            name: ref.name,
            imageUrl: ref.imageUrl,
            rarity: ref.rarity,
            priceCents: ref.priceCents,
          }
        : undefined,
    };
  }
}
