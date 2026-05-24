import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@muzkle/contracts';
import { CollectionQueueProcessor } from './collection-queue.processor';
import { StickerRef } from '../../modules/stickers/entities/sticker-ref.entity';
import { MissionProgress } from '../../modules/missions/entities/mission-progress.entity';
import { ProcessedEvent } from '../../modules/events/entities/processed-event.entity';
import { MintModule } from '../../modules/mint/mint.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get('REDIS_URL') },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: QUEUE_NAMES.COLLECTION }),
    TypeOrmModule.forFeature([StickerRef, MissionProgress, ProcessedEvent]),
    MintModule,
  ],
  providers: [CollectionQueueProcessor],
})
export class QueueModule {}
