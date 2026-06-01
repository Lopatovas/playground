import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { SuggestSourceDto } from './dto/suggest-source.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Sources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/sources')
export class SourcesController {
  constructor(private sourcesService: SourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List all sources for an entity' })
  @ApiQuery({ name: 'entityId', description: 'Entity UUID', required: true })
  findByEntity(@Query('entityId') entityId: string) {
    return this.sourcesService.findByEntity(entityId);
  }

  @Post('suggest')
  @ApiOperation({ summary: 'Suggest a new source URL for an entity' })
  @ApiResponse({ status: 201, description: 'Source created or already exists' })
  suggestSource(@Body() dto: SuggestSourceDto) {
    return this.sourcesService.suggestSource(dto);
  }

  @Post('discover')
  @ApiOperation({ summary: 'Trigger automated source discovery via SearXNG' })
  @ApiQuery({ name: 'entityId', description: 'Entity UUID', required: true })
  @ApiResponse({ status: 201, description: 'Returns number of sources discovered' })
  discover(@Query('entityId') entityId: string) {
    return this.sourcesService.discoverSources(entityId);
  }
}
