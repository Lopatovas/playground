import { Injectable, Logger } from '@nestjs/common';
import { SignalType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
  ) {}

  async extractFromDocument(documentId: string): Promise<number> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { entity: true },
    });
    if (!document) return 0;

    const extracted = await this.llmService.extractSignals(
      document.rawText,
      document.entity.name,
    );

    let created = 0;
    for (const signal of extracted) {
      await this.prisma.signal.create({
        data: {
          entityId: document.entityId,
          documentId: document.id,
          type: signal.type,
          summary: signal.summary,
          confidence: signal.confidence,
          evidence: signal.evidence,
        },
      });
      created++;
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { processed: true },
    });

    return created;
  }

  async extractUnprocessed(entityId?: string): Promise<number> {
    const where: any = { processed: false };
    if (entityId) where.entityId = entityId;

    const documents = await this.prisma.document.findMany({
      where,
      take: 50,
    });

    let total = 0;
    for (const doc of documents) {
      total += await this.extractFromDocument(doc.id);
    }
    return total;
  }

  async findAll(filters: {
    entityId?: string;
    type?: SignalType;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.type) where.type = filters.type;

    const [signals, count] = await Promise.all([
      this.prisma.signal.findMany({
        where,
        include: {
          entity: { select: { id: true, name: true, domain: true } },
          feedback: true,
        },
        orderBy: { detectedAt: 'desc' },
        take: filters.limit || 20,
        skip: filters.offset || 0,
      }),
      this.prisma.signal.count({ where }),
    ]);

    return { signals, total: count };
  }
}
