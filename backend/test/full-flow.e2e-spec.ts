import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Full-flow integration test that exercises:
 *   Register → Login → Create Entity → Add Competitor →
 *   Suggest Source → Ingest (mocked via direct document creation) →
 *   Extract Signals → View Feed → Submit Feedback → Verify Ranking
 */
describe('Full Flow Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let entityId: string;
  let competitorEntityId: string;
  let competitorRelationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Clean database before test run
    await prisma.feedback.deleteMany();
    await prisma.signal.deleteMany();
    await prisma.document.deleteMany();
    await prisma.source.deleteMany();
    await prisma.competitor.deleteMany();
    await prisma.entity.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.feedback.deleteMany();
    await prisma.signal.deleteMany();
    await prisma.document.deleteMany();
    await prisma.source.deleteMany();
    await prisma.competitor.deleteMany();
    await prisma.entity.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  // ─── Step 1: Register ────────────────────────────────────────────
  it('POST /api/auth/register — should register a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'integration@test.com',
        password: 'securepass123',
        company: 'TestCorp',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('integration@test.com');
    accessToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  it('POST /api/auth/register — should reject duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'integration@test.com',
        password: 'anotherpass',
      })
      .expect(409);
  });

  // ─── Step 2: Login ───────────────────────────────────────────────
  it('POST /api/auth/login — should log in with valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'integration@test.com',
        password: 'securepass123',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken;
  });

  it('POST /api/auth/login — should reject wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'integration@test.com',
        password: 'wrongpass',
      })
      .expect(401);
  });

  // ─── Step 3: Get Profile ─────────────────────────────────────────
  it('GET /api/auth/profile — should return current user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe('integration@test.com');
    expect(res.body.company).toBe('TestCorp');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /api/auth/profile — should reject without token', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/profile')
      .expect(401);
  });

  // ─── Step 4: Create Entity ───────────────────────────────────────
  it('POST /api/entities — should create an entity', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/entities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'My Company', domain: 'mycompany.com' })
      .expect(201);

    expect(res.body.name).toBe('My Company');
    expect(res.body.normalizedName).toBe('my-company');
    expect(res.body.domain).toBe('mycompany.com');
    entityId = res.body.id;
  });

  it('POST /api/entities — should reject duplicate entity name', async () => {
    await request(app.getHttpServer())
      .post('/api/entities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'My Company' })
      .expect(409);
  });

  // ─── Step 5: List Entities ───────────────────────────────────────
  it('GET /api/entities — should list user entities', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/entities')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('My Company');
  });

  // ─── Step 6: Add Competitor ──────────────────────────────────────
  it('POST /api/entities/:id/competitors — should add a competitor', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/entities/${entityId}/competitors`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Rival Inc', domain: 'rival.com' })
      .expect(201);

    expect(res.body.competitor.name).toBe('Rival Inc');
    competitorEntityId = res.body.competitorEntityId;
    competitorRelationId = res.body.id;
  });

  it('POST /api/entities/:id/competitors — should reject adding self', async () => {
    await request(app.getHttpServer())
      .post(`/api/entities/${entityId}/competitors`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'My Company' })
      .expect(409);
  });

  // ─── Step 7: Get Entity Detail ───────────────────────────────────
  it('GET /api/entities/:id — should include competitors', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/entities/${entityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.competitors).toHaveLength(1);
    expect(res.body.competitors[0].competitor.name).toBe('Rival Inc');
  });

  // ─── Step 8: Suggest Source ──────────────────────────────────────
  it('POST /api/sources/suggest — should add a user-suggested source', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/sources/suggest')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        entityId: competitorEntityId,
        url: 'https://rival.com/pricing',
        type: 'WEBSITE',
      })
      .expect(201);

    expect(res.body.url).toBe('https://rival.com/pricing');
    expect(res.body.discoveryMethod).toBe('USER_SUGGESTION');
  });

  // ─── Step 9: List Sources ────────────────────────────────────────
  it('GET /api/sources — should list sources for entity', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/sources?entityId=${competitorEntityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].url).toBe('https://rival.com/pricing');
  });

  // ─── Step 10: Create Documents Directly (simulated ingestion) ───
  let documentIds: string[];

  it('should create test documents to simulate ingestion', async () => {
    const docs = [
      {
        entityId: competitorEntityId,
        rawText:
          'Rival Inc has announced a major pricing change. ' +
          'The new plans start at $49/month, up from $29/month. ' +
          'This represents a significant cost increase for customers.',
        url: 'https://rival.com/pricing',
      },
      {
        entityId: competitorEntityId,
        rawText:
          'Rival Inc is launching an exciting new feature: AI-powered analytics. ' +
          'This release marks a major update to their platform. ' +
          'The announcement was made at their annual conference.',
        url: 'https://rival.com/blog/new-feature',
      },
      {
        entityId: competitorEntityId,
        rawText:
          'Rival Inc is on a hiring spree. They are looking for 50 engineers. ' +
          'Multiple job openings have been posted. Join our team and help build the future.',
        url: 'https://rival.com/careers',
      },
    ];

    // We need source records for these docs
    const source = await prisma.source.findFirst({
      where: { entityId: competitorEntityId },
    });

    const created = [];
    for (const doc of docs) {
      const d = await prisma.document.create({
        data: {
          sourceId: source!.id,
          entityId: doc.entityId,
          rawText: doc.rawText,
          url: doc.url,
          processed: false,
        },
      });
      created.push(d.id);
    }

    documentIds = created;
    expect(documentIds).toHaveLength(3);
  });

  // ─── Step 11: Extract Signals ────────────────────────────────────
  it('POST /api/signals/extract — should extract signals from unprocessed documents', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/signals/extract?entityId=${competitorEntityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    // The stub LLM should detect pricing, feature, and hiring signals
    expect(res.body.extracted).toBeGreaterThanOrEqual(3);
  });

  // ─── Step 12: Verify Documents Marked Processed ──────────────────
  it('should mark all documents as processed', async () => {
    for (const docId of documentIds) {
      const doc = await prisma.document.findUnique({ where: { id: docId } });
      expect(doc!.processed).toBe(true);
    }
  });

  // ─── Step 13: List Signals ───────────────────────────────────────
  let signalIds: string[];

  it('GET /api/signals — should return extracted signals', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/signals?entityId=${competitorEntityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.signals.length).toBeGreaterThanOrEqual(3);
    expect(res.body.total).toBeGreaterThanOrEqual(3);

    signalIds = res.body.signals.map((s: any) => s.id);

    // Verify signal types present
    const types = res.body.signals.map((s: any) => s.type);
    expect(types).toContain('PRICING_CHANGE');
    expect(types).toContain('FEATURE_LAUNCH');
    expect(types).toContain('HIRING_SPIKE');
  });

  it('GET /api/signals — should filter by type', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/signals?type=PRICING_CHANGE`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.signals.length).toBeGreaterThanOrEqual(1);
    res.body.signals.forEach((s: any) => {
      expect(s.type).toBe('PRICING_CHANGE');
    });
  });

  // ─── Step 14: View Feed ──────────────────────────────────────────
  it('GET /api/feed — should return ranked feed items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/feed?days=30')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.items.length).toBeGreaterThanOrEqual(3);

    // Feed items should be sorted by relevance score descending
    for (let i = 1; i < res.body.items.length; i++) {
      expect(res.body.items[i - 1].relevanceScore).toBeGreaterThanOrEqual(
        res.body.items[i].relevanceScore,
      );
    }

    // Each item should have expected fields
    const item = res.body.items[0];
    expect(item).toHaveProperty('entityName');
    expect(item).toHaveProperty('type');
    expect(item).toHaveProperty('summary');
    expect(item).toHaveProperty('confidence');
    expect(item).toHaveProperty('relevanceScore');
    expect(item).toHaveProperty('feedbackCount');
  });

  // ─── Step 15: Daily Brief ────────────────────────────────────────
  it('GET /api/feed/daily-brief — should return grouped brief', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/feed/daily-brief')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('date');
    expect(res.body).toHaveProperty('totalSignals');
    expect(res.body).toHaveProperty('sections');
    expect(res.body.totalSignals).toBeGreaterThanOrEqual(3);
    expect(res.body.sections.length).toBeGreaterThanOrEqual(1);

    // Each section should have type, count, and items
    res.body.sections.forEach((section: any) => {
      expect(section).toHaveProperty('type');
      expect(section).toHaveProperty('count');
      expect(section).toHaveProperty('items');
      expect(section.count).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Step 16: Submit Feedback ────────────────────────────────────
  it('POST /api/feedback — should submit positive feedback', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feedback')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        signalId: signalIds[0],
        relevant: true,
        comment: 'Very useful signal!',
      })
      .expect(201);

    expect(res.body.relevant).toBe(true);
    expect(res.body.comment).toBe('Very useful signal!');
  });

  it('POST /api/feedback — should submit negative feedback', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feedback')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        signalId: signalIds[1],
        relevant: false,
      })
      .expect(201);

    expect(res.body.relevant).toBe(false);
  });

  it('POST /api/feedback — should update existing feedback (upsert)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feedback')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        signalId: signalIds[0],
        relevant: false,
        comment: 'Changed my mind',
      })
      .expect(201);

    expect(res.body.relevant).toBe(false);
    expect(res.body.comment).toBe('Changed my mind');
  });

  // ─── Step 17: Verify Feed Reflects Feedback ──────────────────────
  it('GET /api/feed — feed should include feedback counts', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/feed?days=30')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const feedbackedItems = res.body.items.filter(
      (i: any) =>
        i.feedbackCount.relevant > 0 || i.feedbackCount.irrelevant > 0,
    );
    expect(feedbackedItems.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Step 18: Mute Competitor ────────────────────────────────────
  it('PATCH /api/entities/:id/competitors/:cid/mute — should mute competitor', async () => {
    const res = await request(app.getHttpServer())
      .patch(
        `/api/entities/${entityId}/competitors/${competitorEntityId}/mute`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.muted).toBe(true);
    expect(res.body.mutedAt).toBeDefined();
  });

  it('GET /api/feed — should exclude muted competitor signals from feed', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/feed?days=30')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // The competitor is muted, so their signals should be filtered out
    const competitorItems = res.body.items.filter(
      (i: any) => i.entityName === 'Rival Inc',
    );
    expect(competitorItems).toHaveLength(0);
  });

  // ─── Step 19: Unmute and verify signals return ───────────────────
  it('PATCH mute toggle — should unmute competitor', async () => {
    const res = await request(app.getHttpServer())
      .patch(
        `/api/entities/${entityId}/competitors/${competitorEntityId}/mute`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.muted).toBe(false);
  });

  it('GET /api/feed — should include signals again after unmute', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/feed?days=30')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const competitorItems = res.body.items.filter(
      (i: any) => i.entityName === 'Rival Inc',
    );
    expect(competitorItems.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Step 20: Remove Competitor ──────────────────────────────────
  it('DELETE /api/entities/:id/competitors/:cid — should remove competitor', async () => {
    await request(app.getHttpServer())
      .delete(`/api/entities/${entityId}/competitors/${competitorEntityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Verify removal
    const res = await request(app.getHttpServer())
      .get(`/api/entities/${entityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.competitors).toHaveLength(0);
  });

  // ─── Step 21: Delete Entity ──────────────────────────────────────
  it('DELETE /api/entities/:id — should delete entity and cascade', async () => {
    await request(app.getHttpServer())
      .delete(`/api/entities/${entityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/entities')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Only the competitor entity remains (it was created separately)
    const myCompany = res.body.find((e: any) => e.name === 'My Company');
    expect(myCompany).toBeUndefined();
  });
});
