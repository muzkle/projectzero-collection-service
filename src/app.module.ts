import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './infrastructure/health/health.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { CatalogModule } from './infrastructure/clients/catalog.module';
import { IdentityModule } from './infrastructure/clients/identity.module';
import { MintModule } from './modules/mint/mint.module';
import { CollectionModule } from './modules/collection/collection.module';
import { StickersModule } from './modules/stickers/stickers.module';
import { InternalModule } from './modules/internal/internal.module';
import { UserSticker } from './modules/stickers/entities/user-sticker.entity';
import { StickerRef } from './modules/stickers/entities/sticker-ref.entity';
import { MissionProgress } from './modules/missions/entities/mission-progress.entity';
import { WishlistItem } from './modules/wishlist/entities/wishlist-item.entity';
import { ProcessedEvent } from './modules/events/entities/processed-event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [UserSticker, StickerRef, MissionProgress, WishlistItem, ProcessedEvent],
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
    }),
    CatalogModule,
    IdentityModule,
    MintModule,
    CollectionModule,
    StickersModule,
    InternalModule,
    QueueModule,
    HealthModule,
  ],
})
export class AppModule {}
