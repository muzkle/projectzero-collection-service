import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { UserSticker } from '../stickers/entities/user-sticker.entity';
import { StickerRef } from '../stickers/entities/sticker-ref.entity';
import { WishlistItem } from '../wishlist/entities/wishlist-item.entity';
import { IdentityModule } from '../../infrastructure/clients/identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSticker, StickerRef, WishlistItem]),
    IdentityModule,
  ],
  controllers: [CollectionController],
  providers: [CollectionService, WishlistService],
})
export class CollectionModule {}
