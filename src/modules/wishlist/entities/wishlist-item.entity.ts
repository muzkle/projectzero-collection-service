import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('wishlist_items')
export class WishlistItem {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @PrimaryColumn({ name: 'sticker_id', type: 'uuid' })
  stickerId!: string;

  @CreateDateColumn({ name: 'added_at', type: 'timestamptz' })
  addedAt!: Date;
}
