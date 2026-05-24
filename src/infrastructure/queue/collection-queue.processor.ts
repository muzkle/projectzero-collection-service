import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import {
  AcquiredVia,
  JOB_NAMES,
  MissionValidatedEvent,
  PurchaseCompletedEvent,
  QUEUE_NAMES,
  Rarity,
  StickerPublishedEvent,
} from '@projectzero/contracts';
import { StickerRef } from '../../modules/stickers/entities/sticker-ref.entity';
import { ProcessedEvent } from '../../modules/events/entities/processed-event.entity';
import { MintService } from '../../modules/mint/mint.service';
import { MissionProgress } from '../../modules/missions/entities/mission-progress.entity';

@Processor(QUEUE_NAMES.COLLECTION)
export class CollectionQueueProcessor extends WorkerHost {
  constructor(
    @InjectRepository(StickerRef)
    private stickerRefs: Repository<StickerRef>,
    @InjectRepository(MissionProgress)
    private missionProgress: Repository<MissionProgress>,
    @InjectRepository(ProcessedEvent)
    private processedEvents: Repository<ProcessedEvent>,
    private mintService: MintService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOB_NAMES.STICKER_PUBLISHED:
        await this.handleStickerPublished(job.data as StickerPublishedEvent);
        break;
      case JOB_NAMES.PURCHASE_COMPLETED:
        await this.handlePurchaseCompleted(job.data as PurchaseCompletedEvent);
        break;
      case JOB_NAMES.MISSION_VALIDATED:
        await this.handleMissionValidated(job.data as MissionValidatedEvent);
        break;
      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  }

  private async ensureNotProcessed(eventId: string): Promise<boolean> {
    const existing = await this.processedEvents.findOne({ where: { eventId } });
    if (existing) return false;
    await this.processedEvents.save({ eventId });
    return true;
  }

  private async handleStickerPublished(event: StickerPublishedEvent): Promise<void> {
    if (!(await this.ensureNotProcessed(event.eventId))) return;

    await this.stickerRefs.save({
      id: event.stickerId,
      albumId: event.albumId,
      partnerId: event.partnerId,
      name: event.name,
      imageUrl: event.imageUrl,
      rarity: event.rarity as Rarity,
      priceCents: event.priceCents,
    });
  }

  private async handlePurchaseCompleted(event: PurchaseCompletedEvent): Promise<void> {
    if (!(await this.ensureNotProcessed(event.eventId))) return;

    await this.mintService.mint({
      userId: event.userId,
      stickerId: event.stickerId,
      acquiredVia: AcquiredVia.PURCHASE,
      purchaseId: event.purchaseId,
    });
  }

  private async handleMissionValidated(event: MissionValidatedEvent): Promise<void> {
    if (!(await this.ensureNotProcessed(event.eventId))) return;

    const existing = await this.missionProgress.findOne({
      where: { userId: event.userId, missionId: event.missionId },
    });

    const completedAt = event.completed ? new Date(event.occurredAt) : existing?.completedAt ?? null;

    await this.missionProgress.save({
      userId: event.userId,
      missionId: event.missionId,
      stickerId: event.stickerId,
      progress: event.progress,
      completedAt,
      eligible: event.completed,
    });
  }
}
