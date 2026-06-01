import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SignalType } from '@prisma/client';
import { SignalsService } from './signals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/signals')
export class SignalsController {
  constructor(private signalsService: SignalsService) {}

  @Get()
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
  extractUnprocessed(@Query('entityId') entityId?: string) {
    return this.signalsService.extractUnprocessed(entityId);
  }
}
