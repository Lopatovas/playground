import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(private prisma: PrismaService) {}

  async ingestSource(sourceId: string): Promise<string | null> {
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
    });
    if (!source || !source.isActive) return null;

    try {
      const html = await this.fetchUrl(source.url);
      if (!html) return null;

      const cleanText = this.extractText(html);
      if (!cleanText || cleanText.length < 50) return null;

      const document = await this.prisma.document.create({
        data: {
          sourceId: source.id,
          entityId: source.entityId,
          rawText: cleanText.substring(0, 50000),
          url: source.url,
        },
      });

      await this.prisma.source.update({
        where: { id: sourceId },
        data: { lastCheckedAt: new Date() },
      });

      return document.id;
    } catch (error) {
      this.logger.warn(`Ingestion failed for source ${sourceId}: ${error}`);
      return null;
    }
  }

  async ingestAllForEntity(entityId: string): Promise<number> {
    const sources = await this.prisma.source.findMany({
      where: { entityId, isActive: true },
    });

    let ingested = 0;
    for (const source of sources) {
      const docId = await this.ingestSource(source.id);
      if (docId) ingested++;
    }

    return ingested;
  }

  async fetchUrl(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; CompetitorIntel/1.0)',
        },
        maxRedirects: 3,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch ${url}: ${error}`);
      return null;
    }
  }

  extractText(html: string): string {
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header, iframe, noscript').remove();

    const text = $('body').text();
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
