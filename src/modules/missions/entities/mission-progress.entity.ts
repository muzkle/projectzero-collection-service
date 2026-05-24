import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('mission_progress')
export class MissionProgress {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @PrimaryColumn({ name: 'mission_id', type: 'uuid' })
  missionId!: string;

  @Column({ name: 'sticker_id', type: 'uuid' })
  stickerId!: string;

  @Column({ type: 'jsonb', default: {} })
  progress!: Record<string, unknown>;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'boolean', default: false })
  eligible!: boolean;
}
