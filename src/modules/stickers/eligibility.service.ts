import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EligibilityDto, ErrorCode } from '@muzkle/contracts';
import { StickerRef } from '../stickers/entities/sticker-ref.entity';
import { MissionProgress } from '../missions/entities/mission-progress.entity';
import { UserSticker } from '../stickers/entities/user-sticker.entity';
import { DomainException } from '../../common/exceptions/domain.exception';

@Injectable()
export class EligibilityService {
  constructor(
    @InjectRepository(StickerRef)
    private stickerRefs: Repository<StickerRef>,
    @InjectRepository(MissionProgress)
    private missionProgress: Repository<MissionProgress>,
    @InjectRepository(UserSticker)
    private userStickers: Repository<UserSticker>,
  ) {}

  async getEligibility(userId: string, stickerId: string): Promise<EligibilityDto> {
    const ref = await this.stickerRefs.findOne({ where: { id: stickerId } });
    if (!ref) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Sticker not found', 404);
    }

    const owned = await this.userStickers.exists({ where: { userId, stickerId } });
    if (owned) {
      return {
        owned: true,
        eligible: false,
        missionCompleted: false,
        reason: 'Already owned',
      };
    }

    const progress = await this.missionProgress.find({
      where: { userId, stickerId },
    });

    const missionCompleted = progress.some((p) => p.eligible || p.completedAt != null);
    const requiresMission = progress.length > 0;

    if (ref.priceCents > 0) {
      const eligible = !requiresMission || missionCompleted;
      return {
        owned: false,
        eligible,
        missionCompleted,
        reason: eligible ? undefined : 'Mission not completed',
      };
    }

    const eligible = !requiresMission || missionCompleted;
    return {
      owned: false,
      eligible,
      missionCompleted,
      reason: eligible ? undefined : 'Mission not completed',
    };
  }
}
