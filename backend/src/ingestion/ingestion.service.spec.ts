import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('axios');
import axios from 'axios';

describe('IngestionService', () => {
  let service: IngestionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      source: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      document: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  describe('ingestSource', () => {
    it('should fetch, clean, and store a document', async () => {
      prisma.source.findUnique.mockResolvedValue({
        id: 's1',
        entityId: 'e1',
        url: 'https://example.com',
        isActive: true,
      });

      (axios.get as jest.Mock).mockResolvedValue({
        data: '<html><body><h1>Hello World</h1><p>This is a test page with enough content to pass the minimum length requirement for ingestion.</p></body></html>',
      });

      prisma.document.create.mockResolvedValue({ id: 'doc-1' });
      prisma.source.update.mockResolvedValue({});

      const docId = await service.ingestSource('s1');
      expect(docId).toBe('doc-1');
      expect(prisma.document.create).toHaveBeenCalled();
    });

    it('should return null for inactive source', async () => {
      prisma.source.findUnique.mockResolvedValue({
        id: 's1',
        isActive: false,
      });

      const result = await service.ingestSource('s1');
      expect(result).toBeNull();
    });

    it('should return null for failed fetch', async () => {
      prisma.source.findUnique.mockResolvedValue({
        id: 's1',
        entityId: 'e1',
        url: 'https://fail.com',
        isActive: true,
      });

      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await service.ingestSource('s1');
      expect(result).toBeNull();
    });
  });

  describe('extractText', () => {
    it('should extract clean text from HTML', () => {
      const html = `
        <html>
          <head><style>body{color:red}</style></head>
          <body>
            <nav>Navigation</nav>
            <main><h1>Title</h1><p>Content here</p></main>
            <footer>Footer</footer>
            <script>alert("x")</script>
          </body>
        </html>
      `;
      const text = service.extractText(html);
      expect(text).toContain('Title');
      expect(text).toContain('Content here');
      expect(text).not.toContain('alert');
      expect(text).not.toContain('color:red');
    });
  });

  describe('ingestAllForEntity', () => {
    it('should ingest all active sources for an entity', async () => {
      prisma.source.findMany.mockResolvedValue([
        { id: 's1', url: 'https://a.com', entityId: 'e1', isActive: true },
        { id: 's2', url: 'https://b.com', entityId: 'e1', isActive: true },
      ]);

      prisma.source.findUnique
        .mockResolvedValueOnce({
          id: 's1',
          entityId: 'e1',
          url: 'https://a.com',
          isActive: true,
        })
        .mockResolvedValueOnce({
          id: 's2',
          entityId: 'e1',
          url: 'https://b.com',
          isActive: true,
        });

      (axios.get as jest.Mock).mockResolvedValue({
        data: '<html><body><p>Enough content here to satisfy the minimum length requirement for document ingestion.</p></body></html>',
      });

      prisma.document.create.mockResolvedValue({ id: 'doc-1' });
      prisma.source.update.mockResolvedValue({});

      const count = await service.ingestAllForEntity('e1');
      expect(count).toBe(2);
    });
  });
});
