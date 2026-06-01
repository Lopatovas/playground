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
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { AddCompetitorDto } from './dto/add-competitor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/entities')
export class EntitiesController {
  constructor(private entitiesService: EntitiesService) {}

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateEntityDto,
  ) {
    return this.entitiesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.entitiesService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.entitiesService.findOne(id, user.id);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.entitiesService.delete(id, user.id);
  }

  @Post(':id/competitors')
  addCompetitor(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AddCompetitorDto,
  ) {
    return this.entitiesService.addCompetitor(id, user.id, dto);
  }

  @Delete(':id/competitors/:competitorId')
  removeCompetitor(
    @Param('id') id: string,
    @Param('competitorId') competitorId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.entitiesService.removeCompetitor(id, competitorId, user.id);
  }

  @Patch(':id/competitors/:competitorId/mute')
  toggleMute(
    @Param('id') id: string,
    @Param('competitorId') competitorId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.entitiesService.toggleMute(id, competitorId, user.id);
  }
}
