import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { StickersModule } from '../stickers/stickers.module';

@Module({
  imports: [StickersModule],
  controllers: [InternalController],
})
export class InternalModule {}
