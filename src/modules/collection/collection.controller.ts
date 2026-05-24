import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { AddWishlistDto } from '../wishlist/dto/add-wishlist.dto';
import { UserIdGuard } from '../../common/guards/user-id.guard';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';

@Controller('me')
@UseGuards(UserIdGuard)
export class CollectionController {
  constructor(
    private collection: CollectionService,
    private wishlist: WishlistService,
  ) {}

  @Get('collection')
  getCollection(@CurrentUserId() userId: string) {
    return this.collection.getCollection(userId);
  }

  @Get('profile')
  getProfile(@CurrentUserId() userId: string) {
    return this.collection.getProfile(userId);
  }

  @Get('wishlist')
  getWishlist(@CurrentUserId() userId: string) {
    return this.wishlist.list(userId);
  }

  @Post('wishlist')
  addWishlist(@CurrentUserId() userId: string, @Body() dto: AddWishlistDto) {
    return this.wishlist.add(userId, dto.stickerId);
  }

  @Delete('wishlist/:stickerId')
  removeWishlist(
    @CurrentUserId() userId: string,
    @Param('stickerId', ParseUUIDPipe) stickerId: string,
  ) {
    return this.wishlist.remove(userId, stickerId);
  }

  @Get('ranking/:albumId')
  getRanking(@Param('albumId', ParseUUIDPipe) albumId: string) {
    return this.collection.getRanking(albumId);
  }
}
