import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EntitiesService } from './entities.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EntitiesService', () => {
  let service: EntitiesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      entity: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      competitor: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EntitiesService>(EntitiesService);
  });

  describe('create', () => {
    it('should create a new entity with normalized name', async () => {
      prisma.entity.findUnique.mockResolvedValue(null);
      prisma.entity.create.mockResolvedValue({
        id: 'entity-1',
        name: 'Test Company',
        normalizedName: 'test-company',
        domain: 'test.com',
        userId: 'user-1',
      });

      const result = await service.create('user-1', {
        name: 'Test Company',
        domain: 'test.com',
      });

      expect(result.normalizedName).toBe('test-company');
      expect(prisma.entity.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Company',
          normalizedName: 'test-company',
          domain: 'test.com',
          userId: 'user-1',
        },
      });
    });

    it('should throw ConflictException if entity already exists', async () => {
      prisma.entity.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create('user-1', { name: 'Test Company' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all entities for user', async () => {
      prisma.entity.findMany.mockResolvedValue([
        { id: 'e1', name: 'Company A' },
        { id: 'e2', name: 'Company B' },
      ]);

      const result = await service.findAll('user-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return entity if owned by user', async () => {
      prisma.entity.findUnique.mockResolvedValue({
        id: 'e1',
        userId: 'user-1',
        name: 'Test',
      });

      const result = await service.findOne('e1', 'user-1');
      expect(result.name).toBe('Test');
    });

    it('should throw NotFoundException if entity not found', async () => {
      prisma.entity.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not owned by user', async () => {
      prisma.entity.findUnique.mockResolvedValue({
        id: 'e1',
        userId: 'other-user',
      });

      await expect(service.findOne('e1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addCompetitor', () => {
    it('should create a new competitor entity and link it', async () => {
      prisma.entity.findUnique
        .mockResolvedValueOnce({ id: 'e1', userId: 'user-1' })
        .mockResolvedValueOnce(null);
      prisma.entity.create.mockResolvedValue({
        id: 'e2',
        name: 'Competitor',
        normalizedName: 'competitor',
      });
      prisma.competitor.findUnique.mockResolvedValue(null);
      prisma.competitor.create.mockResolvedValue({
        id: 'c1',
        entityId: 'e1',
        competitorEntityId: 'e2',
        competitor: { id: 'e2', name: 'Competitor' },
      });

      const result = await service.addCompetitor('e1', 'user-1', {
        name: 'Competitor',
      });

      expect(result.competitorEntityId).toBe('e2');
    });

    it('should throw if entity not found', async () => {
      prisma.entity.findUnique.mockResolvedValue(null);

      await expect(
        service.addCompetitor('nonexistent', 'user-1', { name: 'Comp' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if adding self as competitor', async () => {
      prisma.entity.findUnique
        .mockResolvedValueOnce({ id: 'e1', userId: 'user-1' })
        .mockResolvedValueOnce({ id: 'e1', normalizedName: 'test' });

      await expect(
        service.addCompetitor('e1', 'user-1', { name: 'test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('toggleMute', () => {
    it('should toggle mute state', async () => {
      prisma.entity.findUnique.mockResolvedValue({
        id: 'e1',
        userId: 'user-1',
      });
      prisma.competitor.findFirst.mockResolvedValue({
        id: 'c1',
        muted: false,
      });
      prisma.competitor.update.mockResolvedValue({
        id: 'c1',
        muted: true,
        mutedAt: new Date(),
      });

      const result = await service.toggleMute('e1', 'e2', 'user-1');
      expect(result.muted).toBe(true);
    });
  });
});
