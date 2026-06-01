import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SignalType } from '@prisma/client';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('stub'),
          },
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  describe('extractSignals', () => {
    it('should detect pricing change signals', async () => {
      const text = 'We are updating our pricing plans starting next month';
      const signals = await service.extractSignals(text, 'TestCo');

      expect(signals.length).toBeGreaterThan(0);
      const pricingSignal = signals.find(
        (s) => s.type === SignalType.PRICING_CHANGE,
      );
      expect(pricingSignal).toBeDefined();
      expect(pricingSignal!.confidence).toBeGreaterThan(0);
    });

    it('should detect feature launch signals', async () => {
      const text = 'We are excited to announce the launch of our new feature';
      const signals = await service.extractSignals(text, 'TestCo');

      const featureSignal = signals.find(
        (s) => s.type === SignalType.FEATURE_LAUNCH,
      );
      expect(featureSignal).toBeDefined();
    });

    it('should detect hiring spike signals', async () => {
      const text = 'We are hiring for multiple positions. Join our team!';
      const signals = await service.extractSignals(text, 'TestCo');

      const hiringSignal = signals.find(
        (s) => s.type === SignalType.HIRING_SPIKE,
      );
      expect(hiringSignal).toBeDefined();
    });

    it('should detect positioning change signals', async () => {
      const text = 'Our new mission and vision reflect our evolving positioning in the market';
      const signals = await service.extractSignals(text, 'TestCo');

      const positioningSignal = signals.find(
        (s) => s.type === SignalType.POSITIONING_CHANGE,
      );
      expect(positioningSignal).toBeDefined();
    });

    it('should return empty array for irrelevant text', async () => {
      const text = 'The weather is nice today and the sky is blue';
      const signals = await service.extractSignals(text, 'TestCo');

      expect(signals).toHaveLength(0);
    });

    it('should detect multiple signal types in one text', async () => {
      const text =
        'We are launching a new feature and updating our pricing. We are also hiring engineers.';
      const signals = await service.extractSignals(text, 'TestCo');

      expect(signals.length).toBeGreaterThanOrEqual(3);
      const types = signals.map((s) => s.type);
      expect(types).toContain(SignalType.PRICING_CHANGE);
      expect(types).toContain(SignalType.FEATURE_LAUNCH);
      expect(types).toContain(SignalType.HIRING_SPIKE);
    });
  });
});
