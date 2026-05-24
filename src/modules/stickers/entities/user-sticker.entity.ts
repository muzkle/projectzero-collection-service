import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AcquiredVia } from '@muzkle/contracts';

@Entity('user_stickers')
@Unique(['userId', 'stickerId'])
@Index(['stickerId'])
export class UserSticker {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'sticker_id', type: 'uuid' })
  stickerId!: string;

  @Column({ name: 'serial_number', type: 'int' })
  serialNumber!: number;

  @Column({ name: 'acquired_via', type: 'varchar', length: 32 })
  acquiredVia!: AcquiredVia;

  @CreateDateColumn({ name: 'acquired_at', type: 'timestamptz' })
  acquiredAt!: Date;

  @Column({ name: 'purchase_id', type: 'uuid', nullable: true })
  purchaseId?: string | null;
}
