import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SignalType } from '@prisma/client';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  getFeed(
    @CurrentUser() user: { id: string },
    @Query('type') type?: SignalType,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.feedService.getFeed(user.id, {
      type,
      days: days ? parseInt(days, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('daily-brief')
  getDailyBrief(@CurrentUser() user: { id: string }) {
    return this.feedService.getDailyBrief(user.id);
  }
}
