import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { AddCompetitorDto } from './dto/add-competitor.dto';

@Injectable()
export class EntitiesService {
  constructor(private prisma: PrismaService) {}

  private normalize(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
  }

  async create(userId: string, dto: CreateEntityDto) {
    const normalizedName = this.normalize(dto.name);

    const existing = await this.prisma.entity.findUnique({
      where: { userId_normalizedName: { userId, normalizedName } },
    });
    if (existing) {
      throw new ConflictException('Entity with this name already exists');
    }

    return this.prisma.entity.create({
      data: {
        name: dto.name,
        normalizedName,
        domain: dto.domain,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.entity.findMany({
      where: { userId },
      include: {
        competitors: {
          include: { competitor: true },
        },
        _count: { select: { sources: true, signals: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        competitors: {
          include: { competitor: true },
        },
        _count: { select: { sources: true, signals: true, documents: true } },
      },
    });
    if (!entity) throw new NotFoundException('Entity not found');
    if (entity.userId !== userId) throw new ForbiddenException();
    return entity;
  }

  async delete(id: string, userId: string) {
    const entity = await this.prisma.entity.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Entity not found');
    if (entity.userId !== userId) throw new ForbiddenException();
    await this.prisma.entity.delete({ where: { id } });
    return { deleted: true };
  }

  async addCompetitor(entityId: string, userId: string, dto: AddCompetitorDto) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
    });
    if (!entity) throw new NotFoundException('Entity not found');
    if (entity.userId !== userId) throw new ForbiddenException();

    const normalizedName = this.normalize(dto.name);

    let competitorEntity = await this.prisma.entity.findUnique({
      where: { userId_normalizedName: { userId, normalizedName } },
    });

    if (!competitorEntity) {
      competitorEntity = await this.prisma.entity.create({
        data: {
          name: dto.name,
          normalizedName,
          domain: dto.domain,
          userId,
        },
      });
    }

    if (competitorEntity.id === entityId) {
      throw new ConflictException('Cannot add entity as its own competitor');
    }

    const existing = await this.prisma.competitor.findUnique({
      where: {
        entityId_competitorEntityId: {
          entityId,
          competitorEntityId: competitorEntity.id,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Competitor already added');
    }

    return this.prisma.competitor.create({
      data: {
        entityId,
        competitorEntityId: competitorEntity.id,
      },
      include: { competitor: true },
    });
  }

  async removeCompetitor(
    entityId: string,
    competitorId: string,
    userId: string,
  ) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
    });
    if (!entity) throw new NotFoundException('Entity not found');
    if (entity.userId !== userId) throw new ForbiddenException();

    const competitor = await this.prisma.competitor.findFirst({
      where: { entityId, competitorEntityId: competitorId },
    });
    if (!competitor) throw new NotFoundException('Competitor not found');

    await this.prisma.competitor.delete({ where: { id: competitor.id } });
    return { deleted: true };
  }

  async toggleMute(
    entityId: string,
    competitorId: string,
    userId: string,
  ) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
    });
    if (!entity) throw new NotFoundException('Entity not found');
    if (entity.userId !== userId) throw new ForbiddenException();

    const competitor = await this.prisma.competitor.findFirst({
      where: { entityId, competitorEntityId: competitorId },
    });
    if (!competitor) throw new NotFoundException('Competitor not found');

    return this.prisma.competitor.update({
      where: { id: competitor.id },
      data: {
        muted: !competitor.muted,
        mutedAt: competitor.muted ? null : new Date(),
      },
      include: { competitor: true },
    });
  }
}
