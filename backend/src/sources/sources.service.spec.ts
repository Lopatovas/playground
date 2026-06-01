import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SourceType, DiscoveryMethod } from '@prisma/client';
import { SourcesService } from './sources.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('axios');
import axios from 'axios';

describe('SourcesService', () => {
  let service: SourcesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      source: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      entity: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourcesService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:8888'),
          },
        },
      ],
    }).compile();

    service = module.get<SourcesService>(SourcesService);
  });

  describe('findByEntity', () => {
    it('should return sources for an entity', async () => {
      const sources = [
        { id: 's1', url: 'https://example.com', type: SourceType.WEBSITE },
      ];
      prisma.source.findMany.mockResolvedValue(sources);

      const result = await service.findByEntity('entity-1');
      expect(result).toEqual(sources);
    });
  });

  describe('suggestSource', () => {
    it('should create a user-suggested source', async () => {
      prisma.entity.findUnique.mockResolvedValue({ id: 'e1', name: 'Test' });
      prisma.source.upsert.mockResolvedValue({
        id: 's1',
        url: 'https://example.com/blog',
        type: SourceType.BLOG,
        discoveryMethod: DiscoveryMethod.USER_SUGGESTION,
      });

      const result = await service.suggestSource({
        entityId: 'e1',
        url: 'https://example.com/blog',
        type: SourceType.BLOG,
      });

      expect(result.discoveryMethod).toBe(DiscoveryMethod.USER_SUGGESTION);
    });
  });

  describe('discoverSources', () => {
    it('should discover sources via SearXNG and save them', async () => {
      prisma.entity.findUnique.mockResolvedValue({
        id: 'e1',
        name: 'TestCo',
        domain: 'testco.com',
      });

      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          results: [
            { url: 'https://testco.com/pricing', title: 'Pricing', content: '' },
            { url: 'https://news.com/testco', title: 'News', content: '' },
          ],
        },
      });

      prisma.source.upsert.mockResolvedValue({ id: 's1' });

      const count = await service.discoverSources('e1');
      expect(count).toBeGreaterThan(0);
    });

    it('should handle search failures gracefully', async () => {
      prisma.entity.findUnique.mockResolvedValue({
        id: 'e1',
        name: 'TestCo',
        domain: null,
      });

      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const count = await service.discoverSources('e1');
      expect(count).toBe(0);
    });
  });

  describe('searchSearxng', () => {
    it('should return parsed search results', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          results: [
            { url: 'https://example.com', title: 'Test', content: 'content' },
          ],
        },
      });

      const results = await service.searchSearxng('test query');
      expect(results).toHaveLength(1);
      expect(results[0].url).toBe('https://example.com');
    });

    it('should return empty array on failure', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('fail'));

      const results = await service.searchSearxng('test');
      expect(results).toEqual([]);
    });
  });
});
