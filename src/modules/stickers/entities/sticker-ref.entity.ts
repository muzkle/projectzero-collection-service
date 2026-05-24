import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Rarity } from '@muzkle/contracts';

@Entity('sticker_refs')
export class StickerRef {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'album_id', type: 'uuid' })
  albumId!: string;

  @Column({ name: 'partner_id', type: 'uuid' })
  partnerId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl!: string;

  @Column({ type: 'varchar', length: 32 })
  rarity!: Rarity;

  @Column({ name: 'price_cents', type: 'int' })
  priceCents!: number;
}
