import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SignalType } from '@prisma/client';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Feed')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get ranked intelligence feed for the current user' })
  @ApiQuery({ name: 'type', required: false, enum: ['PRICING_CHANGE', 'FEATURE_LAUNCH', 'POSITIONING_CHANGE', 'HIRING_SPIKE'] })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Time window in days (default: 7)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
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
  @ApiOperation({ summary: 'Get daily intelligence brief grouped by signal type' })
  getDailyBrief(@CurrentUser() user: { id: string }) {
    return this.feedService.getDailyBrief(user.id);
  }
}
