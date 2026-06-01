import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignalType } from '@prisma/client';

export interface ExtractedSignal {
  type: SignalType;
  summary: string;
  confidence: number;
  evidence: Record<string, any>;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly provider: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<string>('LLM_PROVIDER', 'stub');
  }

  async extractSignals(
    text: string,
    entityName: string,
  ): Promise<ExtractedSignal[]> {
    if (this.provider === 'stub') {
      return this.stubExtraction(text, entityName);
    }

    return this.callMistral(text, entityName);
  }

  private stubExtraction(
    text: string,
    entityName: string,
  ): ExtractedSignal[] {
    const signals: ExtractedSignal[] = [];
    const lower = text.toLowerCase();

    if (
      lower.includes('price') ||
      lower.includes('pricing') ||
      lower.includes('cost') ||
      lower.includes('plan')
    ) {
      signals.push({
        type: SignalType.PRICING_CHANGE,
        summary: `Potential pricing change detected for ${entityName}`,
        confidence: 0.6,
        evidence: {
          matchedKeywords: ['price', 'pricing', 'cost', 'plan'].filter((k) =>
            lower.includes(k),
          ),
          textSnippet: text.substring(0, 200),
        },
      });
    }

    if (
      lower.includes('launch') ||
      lower.includes('new feature') ||
      lower.includes('release') ||
      lower.includes('announcing') ||
      lower.includes('update')
    ) {
      signals.push({
        type: SignalType.FEATURE_LAUNCH,
        summary: `Potential feature launch or product update for ${entityName}`,
        confidence: 0.65,
        evidence: {
          matchedKeywords: [
            'launch',
            'new feature',
            'release',
            'announcing',
            'update',
          ].filter((k) => lower.includes(k)),
          textSnippet: text.substring(0, 200),
        },
      });
    }

    if (
      lower.includes('hiring') ||
      lower.includes('careers') ||
      lower.includes('job opening') ||
      lower.includes('we\'re growing') ||
      lower.includes('join our team')
    ) {
      signals.push({
        type: SignalType.HIRING_SPIKE,
        summary: `Hiring activity detected for ${entityName}`,
        confidence: 0.55,
        evidence: {
          matchedKeywords: [
            'hiring',
            'careers',
            'job opening',
            'join our team',
          ].filter((k) => lower.includes(k)),
          textSnippet: text.substring(0, 200),
        },
      });
    }

    if (
      lower.includes('rebrand') ||
      lower.includes('mission') ||
      lower.includes('vision') ||
      lower.includes('positioning') ||
      lower.includes('target market')
    ) {
      signals.push({
        type: SignalType.POSITIONING_CHANGE,
        summary: `Potential positioning shift for ${entityName}`,
        confidence: 0.5,
        evidence: {
          matchedKeywords: [
            'rebrand',
            'mission',
            'vision',
            'positioning',
            'target market',
          ].filter((k) => lower.includes(k)),
          textSnippet: text.substring(0, 200),
        },
      });
    }

    return signals;
  }

  private async callMistral(
    text: string,
    entityName: string,
  ): Promise<ExtractedSignal[]> {
    // Placeholder for Mistral API integration
    this.logger.log(
      `Mistral integration not yet implemented, falling back to stub for ${entityName}`,
    );
    return this.stubExtraction(text, entityName);
  }
}
