import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SourceType, DiscoveryMethod } from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { SuggestSourceDto } from './dto/suggest-source.dto';

interface SearxResult {
  url: string;
  title: string;
  content: string;
  category?: string;
}

@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name);
  private readonly searxngUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.searxngUrl = this.configService.get<string>('SEARXNG_URL', 'http://localhost:8888');
  }

  async findByEntity(entityId: string) {
    return this.prisma.source.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async suggestSource(dto: SuggestSourceDto) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: dto.entityId },
    });
    if (!entity) throw new NotFoundException('Entity not found');

    const type = dto.type || this.inferSourceType(dto.url);

    return this.prisma.source.upsert({
      where: {
        entityId_url: { entityId: dto.entityId, url: dto.url },
      },
      update: {},
      create: {
        entityId: dto.entityId,
        url: dto.url,
        type,
        discoveryMethod: DiscoveryMethod.USER_SUGGESTION,
        isActive: true,
      },
    });
  }

  async discoverSources(entityId: string): Promise<number> {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
    });
    if (!entity) throw new NotFoundException('Entity not found');

    const queries = this.buildSearchQueries(entity.name, entity.domain);
    let discovered = 0;

    for (const { query, type } of queries) {
      try {
        const results = await this.searchSearxng(query);
        for (const result of results) {
          try {
            await this.prisma.source.upsert({
              where: {
                entityId_url: { entityId, url: result.url },
              },
              update: {},
              create: {
                entityId,
                url: result.url,
                type,
                discoveryMethod: DiscoveryMethod.SEARCH,
                isActive: true,
              },
            });
            discovered++;
          } catch {
            // duplicate or constraint violation, skip
          }
        }
      } catch (error) {
        this.logger.warn(`Search failed for query "${query}": ${error}`);
      }
    }

    return discovered;
  }

  private buildSearchQueries(
    name: string,
    domain: string | null,
  ): { query: string; type: SourceType }[] {
    const queries = [
      { query: `${name} pricing`, type: SourceType.WEBSITE },
      { query: `${name} product updates`, type: SourceType.NEWS },
      { query: `${name} blog`, type: SourceType.BLOG },
      { query: `${name} careers jobs`, type: SourceType.JOBS },
      { query: `${name} news`, type: SourceType.NEWS },
      { query: `${name} twitter`, type: SourceType.SOCIAL },
    ];

    if (domain) {
      queries.push({
        query: `site:${domain} pricing OR blog OR changelog`,
        type: SourceType.WEBSITE,
      });
    }

    return queries;
  }

  async searchSearxng(query: string): Promise<SearxResult[]> {
    try {
      const response = await axios.get(`${this.searxngUrl}/search`, {
        params: {
          q: query,
          format: 'json',
          categories: 'general',
        },
        timeout: 10000,
      });

      return (response.data.results || []).slice(0, 5).map((r: any) => ({
        url: r.url,
        title: r.title,
        content: r.content,
        category: r.category,
      }));
    } catch (error) {
      this.logger.warn(`SearXNG search failed: ${error}`);
      return [];
    }
  }

  private inferSourceType(url: string): SourceType {
    const lower = url.toLowerCase();
    if (lower.includes('blog') || lower.includes('medium.com'))
      return SourceType.BLOG;
    if (
      lower.includes('news') ||
      lower.includes('techcrunch') ||
      lower.includes('reuters')
    )
      return SourceType.NEWS;
    if (
      lower.includes('careers') ||
      lower.includes('jobs') ||
      lower.includes('lever.co') ||
      lower.includes('greenhouse')
    )
      return SourceType.JOBS;
    if (
      lower.includes('twitter') ||
      lower.includes('linkedin') ||
      lower.includes('x.com')
    )
      return SourceType.SOCIAL;
    return SourceType.WEBSITE;
  }
}
