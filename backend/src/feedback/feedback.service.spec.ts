import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      signal: {
        findUnique: jest.fn(),
      },
      feedback: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
  });

  describe('submitFeedback', () => {
    it('should create or update feedback', async () => {
      prisma.signal.findUnique.mockResolvedValue({ id: 'sig-1' });
      prisma.feedback.upsert.mockResolvedValue({
        id: 'fb-1',
        signalId: 'sig-1',
        userId: 'user-1',
        relevant: true,
      });

      const result = await service.submitFeedback('user-1', {
        signalId: 'sig-1',
        relevant: true,
        comment: 'Very useful',
      });

      expect(result.relevant).toBe(true);
    });

    it('should throw NotFoundException for non-existent signal', async () => {
      prisma.signal.findUnique.mockResolvedValue(null);

      await expect(
        service.submitFeedback('user-1', {
          signalId: 'nonexistent',
          relevant: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
