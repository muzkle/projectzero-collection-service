import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MintService } from './mint.service';
import { UserSticker } from '../stickers/entities/user-sticker.entity';
import { StickerRef } from '../stickers/entities/sticker-ref.entity';
import { CatalogModule } from '../../infrastructure/clients/catalog.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserSticker, StickerRef]), CatalogModule],
  providers: [MintService],
  exports: [MintService],
})
export class MintModule {}
