import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { InternalServiceGuard } from '../../common/guards/internal-service.guard';
import { EligibilityService } from '../stickers/eligibility.service';

@Controller('internal/users')
@UseGuards(InternalServiceGuard)
export class InternalController {
  constructor(private eligibility: EligibilityService) {}

  @Get(':userId/stickers/:stickerId/status')
  async getStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('stickerId', ParseUUIDPipe) stickerId: string,
  ) {
    const result = await this.eligibility.getEligibility(userId, stickerId);
    return { owned: result.owned, eligible: result.eligible };
  }
}
