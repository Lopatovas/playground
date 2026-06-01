import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { AddCompetitorDto } from './dto/add-competitor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Entities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/entities')
export class EntitiesController {
  constructor(private entitiesService: EntitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new entity (your company or a competitor)' })
  @ApiResponse({ status: 201, description: 'Entity created' })
  @ApiResponse({ status: 409, description: 'Entity with this name already exists' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateEntityDto,
  ) {
    return this.entitiesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all entities for the current user' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.entitiesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity details including competitors' })
  @ApiParam({ name: 'id', description: 'Entity UUID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.entitiesService.findOne(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an entity and all its data (cascading)' })
  @ApiParam({ name: 'id', description: 'Entity UUID' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.entitiesService.delete(id, user.id);
  }

  @Post(':id/competitors')
  @ApiOperation({ summary: 'Add a competitor to an entity' })
  @ApiParam({ name: 'id', description: 'Parent entity UUID' })
  @ApiResponse({ status: 201, description: 'Competitor added' })
  @ApiResponse({ status: 409, description: 'Competitor already added or self-reference' })
  addCompetitor(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AddCompetitorDto,
  ) {
    return this.entitiesService.addCompetitor(id, user.id, dto);
  }

  @Delete(':id/competitors/:competitorId')
  @ApiOperation({ summary: 'Remove a competitor from an entity' })
  @ApiParam({ name: 'id', description: 'Parent entity UUID' })
  @ApiParam({ name: 'competitorId', description: 'Competitor entity UUID' })
  removeCompetitor(
    @Param('id') id: string,
    @Param('competitorId') competitorId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.entitiesService.removeCompetitor(id, competitorId, user.id);
  }

  @Patch(':id/competitors/:competitorId/mute')
  @ApiOperation({ summary: 'Toggle mute/unmute for a competitor (hides from feed)' })
  @ApiParam({ name: 'id', description: 'Parent entity UUID' })
  @ApiParam({ name: 'competitorId', description: 'Competitor entity UUID' })
  toggleMute(
    @Param('id') id: string,
    @Param('competitorId') competitorId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.entitiesService.toggleMute(id, competitorId, user.id);
  }
}
