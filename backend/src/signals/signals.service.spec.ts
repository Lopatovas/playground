import { Test, TestingModule } from '@nestjs/testing';
import { SignalType } from '@prisma/client';
import { SignalsService } from './signals.service';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';

describe('SignalsService', () => {
  let service: SignalsService;
  let prisma: any;
  let llmService: any;

  beforeEach(async () => {
    prisma = {
      document: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      signal: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    llmService = {
      extractSignals: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: LlmService, useValue: llmService },
      ],
    }).compile();

    service = module.get<SignalsService>(SignalsService);
  });

  describe('extractFromDocument', () => {
    it('should extract signals from a document and save them', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        entityId: 'e1',
        rawText: 'New pricing announced',
        entity: { name: 'TestCo' },
      });

      llmService.extractSignals.mockResolvedValue([
        {
          type: SignalType.PRICING_CHANGE,
          summary: 'Pricing change detected',
          confidence: 0.8,
          evidence: { keywords: ['pricing'] },
        },
      ]);

      prisma.signal.create.mockResolvedValue({ id: 'sig-1' });
      prisma.document.update.mockResolvedValue({});

      const count = await service.extractFromDocument('doc-1');
      expect(count).toBe(1);
      expect(prisma.signal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityId: 'e1',
          type: SignalType.PRICING_CHANGE,
        }),
      });
    });

    it('should return 0 for non-existent document', async () => {
      prisma.document.findUnique.mockResolvedValue(null);

      const count = await service.extractFromDocument('nonexistent');
      expect(count).toBe(0);
    });

    it('should mark document as processed', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        entityId: 'e1',
        rawText: 'Some text',
        entity: { name: 'Test' },
      });
      llmService.extractSignals.mockResolvedValue([]);
      prisma.document.update.mockResolvedValue({});

      await service.extractFromDocument('doc-1');

      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { processed: true },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated signals', async () => {
      prisma.signal.findMany.mockResolvedValue([
        { id: 's1', type: SignalType.PRICING_CHANGE },
      ]);
      prisma.signal.count.mockResolvedValue(1);

      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(result.signals).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by entityId and type', async () => {
      prisma.signal.findMany.mockResolvedValue([]);
      prisma.signal.count.mockResolvedValue(0);

      await service.findAll({
        entityId: 'e1',
        type: SignalType.FEATURE_LAUNCH,
      });

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entityId: 'e1', type: SignalType.FEATURE_LAUNCH },
        }),
      );
    });
  });

  describe('extractUnprocessed', () => {
    it('should process all unprocessed documents', async () => {
      prisma.document.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          entityId: 'e1',
          rawText: 'Pricing update',
          processed: false,
        },
      ]);
      prisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        entityId: 'e1',
        rawText: 'Pricing update',
        entity: { name: 'Test' },
      });
      llmService.extractSignals.mockResolvedValue([
        {
          type: SignalType.PRICING_CHANGE,
          summary: 'Test',
          confidence: 0.7,
          evidence: {},
        },
      ]);
      prisma.signal.create.mockResolvedValue({ id: 'sig-1' });
      prisma.document.update.mockResolvedValue({});

      const count = await service.extractUnprocessed('e1');
      expect(count).toBe(1);
    });
  });
});
