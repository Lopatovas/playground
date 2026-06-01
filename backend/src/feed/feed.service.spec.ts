import { Test, TestingModule } from '@nestjs/testing';
import { SignalType } from '@prisma/client';
import { FeedService } from './feed.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FeedService', () => {
  let service: FeedService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      entity: {
        findMany: jest.fn(),
      },
      competitor: {
        findMany: jest.fn(),
      },
      signal: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  describe('getFeed', () => {
    it('should return empty feed if user has no entities', async () => {
      prisma.entity.findMany.mockResolvedValue([]);

      const result = await service.getFeed('user-1');
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return ranked feed items', async () => {
      prisma.entity.findMany.mockResolvedValue([
        { id: 'e1' },
        { id: 'e2' },
      ]);
      prisma.competitor.findMany.mockResolvedValue([]);
      prisma.signal.findMany.mockResolvedValue([
        {
          id: 's1',
          entityId: 'e1',
          type: SignalType.PRICING_CHANGE,
          summary: 'Price increase',
          confidence: 0.9,
          evidence: {},
          detectedAt: new Date(),
          entity: { id: 'e1', name: 'Company A', domain: 'a.com' },
          feedback: [],
        },
        {
          id: 's2',
          entityId: 'e2',
          type: SignalType.FEATURE_LAUNCH,
          summary: 'New feature',
          confidence: 0.7,
          evidence: {},
          detectedAt: new Date(),
          entity: { id: 'e2', name: 'Company B', domain: 'b.com' },
          feedback: [],
        },
      ]);
      prisma.signal.count.mockResolvedValue(2);

      const result = await service.getFeed('user-1');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].relevanceScore).toBeGreaterThanOrEqual(
        result.items[1].relevanceScore,
      );
    });

    it('should filter out signals from muted competitors', async () => {
      prisma.entity.findMany.mockResolvedValue([{ id: 'e1' }]);
      prisma.competitor.findMany.mockResolvedValue([
        { competitorEntityId: 'e-muted' },
      ]);
      prisma.signal.findMany.mockResolvedValue([
        {
          id: 's1',
          entityId: 'e-muted',
          type: SignalType.PRICING_CHANGE,
          summary: 'Should be hidden',
          confidence: 0.9,
          evidence: {},
          detectedAt: new Date(),
          entity: { id: 'e-muted', name: 'Muted Co', domain: null },
          feedback: [],
        },
        {
          id: 's2',
          entityId: 'e1',
          type: SignalType.FEATURE_LAUNCH,
          summary: 'Should be shown',
          confidence: 0.7,
          evidence: {},
          detectedAt: new Date(),
          entity: { id: 'e1', name: 'Active Co', domain: null },
          feedback: [],
        },
      ]);
      prisma.signal.count.mockResolvedValue(2);

      const result = await service.getFeed('user-1');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].entityName).toBe('Active Co');
    });

    it('should boost relevance for signals with positive feedback', async () => {
      prisma.entity.findMany.mockResolvedValue([{ id: 'e1' }]);
      prisma.competitor.findMany.mockResolvedValue([]);
      prisma.signal.findMany.mockResolvedValue([
        {
          id: 's1',
          entityId: 'e1',
          type: SignalType.PRICING_CHANGE,
          summary: 'With feedback',
          confidence: 0.5,
          evidence: {},
          detectedAt: new Date(),
          entity: { id: 'e1', name: 'Co', domain: null },
          feedback: [
            { relevant: true },
            { relevant: true },
            { relevant: true },
          ],
        },
        {
          id: 's2',
          entityId: 'e1',
          type: SignalType.FEATURE_LAUNCH,
          summary: 'Without feedback',
          confidence: 0.5,
          evidence: {},
          detectedAt: new Date(),
          entity: { id: 'e1', name: 'Co', domain: null },
          feedback: [],
        },
      ]);
      prisma.signal.count.mockResolvedValue(2);

      const result = await service.getFeed('user-1');
      const withFeedback = result.items.find((i) => i.id === 's1');
      const withoutFeedback = result.items.find((i) => i.id === 's2');
      expect(withFeedback!.relevanceScore).toBeGreaterThan(
        withoutFeedback!.relevanceScore,
      );
    });
  });

  describe('getDailyBrief', () => {
    it('should group signals by type', async () => {
      prisma.entity.findMany.mockResolvedValue([{ id: 'e1' }]);
      prisma.competitor.findMany.mockResolvedValue([]);
      prisma.signal.findMany.mockResolvedValue([
        {
          id: 's1',
          entityId: 'e1',
          type: SignalType.PRICING_CHANGE,
          summary: 'Price',
          confidence: 0.8,
          evidence: {},
          detectedAt: new Date(),
          entity: { id: 'e1', name: 'Co', domain: null },
          feedback: [],
        },
        {
          id: 's2',
          entityId: 'e1',
          type: SignalType.HIRING_SPIKE,
          summary: 'Hiring',
          confidence: 0.7,
          evidence: {},
          detectedAt: new Date(),
          entity: { id: 'e1', name: 'Co', domain: null },
          feedback: [],
        },
      ]);
      prisma.signal.count.mockResolvedValue(2);

      const brief = await service.getDailyBrief('user-1');
      expect(brief.totalSignals).toBe(2);
      expect(brief.sections).toHaveLength(2);
    });
  });
});
