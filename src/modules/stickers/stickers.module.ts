import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StickersController } from './stickers.controller';
import { StickersService } from './stickers.service';
import { EligibilityService } from './eligibility.service';
import { StickerRef } from './entities/sticker-ref.entity';
import { UserSticker } from './entities/user-sticker.entity';
import { MissionProgress } from '../missions/entities/mission-progress.entity';
import { MintModule } from '../mint/mint.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StickerRef, UserSticker, MissionProgress]),
    MintModule,
  ],
  controllers: [StickersController],
  providers: [StickersService, EligibilityService],
  exports: [StickersService, EligibilityService],
})
export class StickersModule {}
