import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignalType } from '@prisma/client';

export interface FeedItem {
  id: string;
  entityName: string;
  entityDomain: string | null;
  type: SignalType;
  summary: string;
  confidence: number;
  evidence: any;
  detectedAt: Date;
  relevanceScore: number;
  feedbackCount: { relevant: number; irrelevant: number };
}

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async getFeed(
    userId: string,
    options: {
      type?: SignalType;
      days?: number;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ items: FeedItem[]; total: number }> {
    const { type, days = 7, limit = 20, offset = 0 } = options;

    const userEntities = await this.prisma.entity.findMany({
      where: { userId },
      select: { id: true },
    });

    const entityIds = userEntities.map((e) => e.id);
    if (entityIds.length === 0) {
      return { items: [], total: 0 };
    }

    const mutedCompetitors = await this.prisma.competitor.findMany({
      where: {
        entityId: { in: entityIds },
        muted: true,
      },
      select: { competitorEntityId: true },
    });
    const mutedIds = new Set(mutedCompetitors.map((c) => c.competitorEntityId));

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = {
      entityId: { in: entityIds },
      detectedAt: { gte: since },
    };
    if (type) where.type = type;

    const [signals, total] = await Promise.all([
      this.prisma.signal.findMany({
        where,
        include: {
          entity: { select: { id: true, name: true, domain: true } },
          feedback: true,
        },
        orderBy: { detectedAt: 'desc' },
        take: limit + 20,
        skip: offset,
      }),
      this.prisma.signal.count({ where }),
    ]);

    const items: FeedItem[] = signals
      .filter((s) => !mutedIds.has(s.entityId))
      .map((s) => {
        const relevant = s.feedback.filter((f) => f.relevant).length;
        const irrelevant = s.feedback.filter((f) => !f.relevant).length;

        return {
          id: s.id,
          entityName: s.entity.name,
          entityDomain: s.entity.domain,
          type: s.type,
          summary: s.summary,
          confidence: s.confidence,
          evidence: s.evidence,
          detectedAt: s.detectedAt,
          relevanceScore: this.computeRelevance(s, relevant, irrelevant),
          feedbackCount: { relevant, irrelevant },
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return { items, total };
  }

  async getDailyBrief(userId: string) {
    const feed = await this.getFeed(userId, { days: 1, limit: 50 });

    const byType: Record<string, FeedItem[]> = {};
    for (const item of feed.items) {
      if (!byType[item.type]) byType[item.type] = [];
      byType[item.type].push(item);
    }

    return {
      date: new Date().toISOString().split('T')[0],
      totalSignals: feed.items.length,
      sections: Object.entries(byType).map(([type, items]) => ({
        type,
        count: items.length,
        items: items.slice(0, 5),
      })),
    };
  }

  private computeRelevance(
    signal: any,
    relevant: number,
    irrelevant: number,
  ): number {
    let score = signal.confidence;

    const ageHours =
      (Date.now() - new Date(signal.detectedAt).getTime()) / (1000 * 60 * 60);
    const recencyBoost = Math.max(0, 1 - ageHours / (24 * 7));
    score += recencyBoost * 0.3;

    const feedbackNet = relevant - irrelevant;
    score += feedbackNet * 0.1;

    return Math.max(0, Math.min(1, score));
  }
}
