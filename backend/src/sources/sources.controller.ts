import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { SuggestSourceDto } from './dto/suggest-source.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/sources')
export class SourcesController {
  constructor(private sourcesService: SourcesService) {}

  @Get()
  findByEntity(@Query('entityId') entityId: string) {
    return this.sourcesService.findByEntity(entityId);
  }

  @Post('suggest')
  suggestSource(@Body() dto: SuggestSourceDto) {
    return this.sourcesService.suggestSource(dto);
  }

  @Post('discover')
  discover(@Query('entityId') entityId: string) {
    return this.sourcesService.discoverSources(entityId);
  }
}
