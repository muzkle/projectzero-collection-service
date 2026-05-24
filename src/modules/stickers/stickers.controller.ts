import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { StickersService } from './stickers.service';
import { UserIdGuard } from '../../common/guards/user-id.guard';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';

@Controller('stickers')
@UseGuards(UserIdGuard)
export class StickersController {
  constructor(private stickers: StickersService) {}

  @Post(':id/claim')
  claim(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) stickerId: string) {
    return this.stickers.claim(userId, stickerId);
  }

  @Get(':id/eligibility')
  eligibility(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) stickerId: string) {
    return this.stickers.getEligibility(userId, stickerId);
  }
}
