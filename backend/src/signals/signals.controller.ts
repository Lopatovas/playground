import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SignalType } from '@prisma/client';
import { SignalsService } from './signals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Signals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/signals')
export class SignalsController {
  constructor(private signalsService: SignalsService) {}

  @Get()
  @ApiOperation({ summary: 'List extracted signals with optional filters' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity UUID' })
  @ApiQuery({ name: 'type', required: false, enum: ['PRICING_CHANGE', 'FEATURE_LAUNCH', 'POSITIONING_CHANGE', 'HIRING_SPIKE'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(
    @Query('entityId') entityId?: string,
    @Query('type') type?: SignalType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.signalsService.findAll({
      entityId,
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Post('extract')
  @ApiOperation({ summary: 'Extract signals from unprocessed documents' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Limit extraction to a specific entity' })
  @ApiResponse({ status: 201, description: 'Returns { extracted: number }' })
  async extractUnprocessed(@Query('entityId') entityId?: string) {
    const count = await this.signalsService.extractUnprocessed(entityId);
    return { extracted: count };
  }
}
