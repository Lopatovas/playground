import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import request from "supertest";
import { buildAssignment } from "./features/assignment/assignment.service.js";
import {
  createTestApp,
  createTestPrisma,
  loginAgent,
  seedUser,
} from "./test/helpers.js";

const apiRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

describe("API integration", () => {
  const prisma = createTestPrisma();
  const app = createTestApp(prisma);

  beforeAll(() => {
    execSync("npx prisma migrate deploy", {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: "pipe",
    });
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, service: "commitloop-api" });
  });

  it("GET /tracks/track-1/stages is public", async () => {
    const res = await request(app).get("/tracks/track-1/stages");
    expect(res.status).toBe(200);
    expect(res.body.trackId).toBe("track-1");
    expect(res.body.stages[0]?.status).toBe("current");
  });

  it("GET /assignment/current requires auth", async () => {
    const res = await request(app).get("/assignment/current");
    expect(res.status).toBe(401);
  });

  it("returns assignment for authenticated user", async () => {
    const user = await seedUser(prisma);
    const agent = await loginAgent(app, user.id);

    const res = await agent.get("/assignment/current");
    expect(res.status).toBe(200);
    expect(res.body.stage.slug).toBe("stage-0-onboarding");
    expect(res.body.step).toBe("lesson");
  });

  it("updates assignment step", async () => {
    const user = await seedUser(prisma);
    const agent = await loginAgent(app, user.id);

    const res = await agent
      .post("/assignment/step")
      .send({ step: "sandbox" })
      .expect(200);

    expect(res.body.step).toBe("sandbox");
    expect(res.body.stepLabel).toBe("Sandbox Task");
  });

  it("rejects invalid step", async () => {
    const user = await seedUser(prisma);
    const agent = await loginAgent(app, user.id);

    await agent.post("/assignment/step").send({ step: "invalid" }).expect(400);
  });

  it("toggles checklist items", async () => {
    const user = await seedUser(prisma);
    const agent = await loginAgent(app, user.id);
    const assignment = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "project",
      "{}",
    )!;
    const itemId = assignment.checklist[0]!.id;

    const res = await agent
      .post("/assignment/checklist")
      .send({ itemId, done: true })
      .expect(200);

    expect(
      res.body.checklist.find((c: { id: string }) => c.id === itemId)?.done,
    ).toBe(true);
  });

  it("blocks advance until checklist is complete", async () => {
    const user = await seedUser(prisma);
    const agent = await loginAgent(app, user.id);

    await agent.post("/assignment/advance").expect(400);
  });

  it("advances stage when checklist is complete", async () => {
    const assignment = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "project",
      "{}",
    )!;
    const checklistState = JSON.stringify(
      Object.fromEntries(assignment.checklist.map((item) => [item.id, true])),
    );
    const user = await seedUser(prisma, {
      currentStep: "project",
      checklistState,
    });
    const agent = await loginAgent(app, user.id);

    const res = await agent.post("/assignment/advance").expect(200);
    expect(res.body.stage.slug).toBe("stage-1-git-fundamentals");
    expect(res.body.step).toBe("lesson");
    expect(res.body.allChecklistDone).toBe(false);
  });

  it("GET /streak without repo returns unconfigured", async () => {
    const user = await seedUser(prisma);
    const agent = await loginAgent(app, user.id);

    const res = await agent.get("/streak").expect(200);
    expect(res.body).toEqual({ configured: false, stats: null });
  });

  it("GET /curriculum/track-1 lists markdown stages", async () => {
    const res = await request(app).get("/curriculum/track-1");
    expect(res.status).toBe(200);
    expect(res.body.stages.length).toBeGreaterThanOrEqual(2);
    expect(res.body.stages[0]).toHaveProperty("content");
  });

  it("GET /me returns the authenticated profile", async () => {
    const user = await seedUser(prisma);
    const agent = await loginAgent(app, user.id);

    const res = await agent.get("/me").expect(200);
    expect(res.body.username).toBe("test-user");
    expect(res.body.currentStage).toBe("stage-0-onboarding");
  });

  it("POST /auth/logout clears the session", async () => {
    const user = await seedUser(prisma);
    const agent = await loginAgent(app, user.id);

    await agent.post("/auth/logout").expect(200);
    await agent.get("/me").expect(401);
  });

  it("POST /repo links a validated repository", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );

    const user = await seedUser(prisma);
    const agent = await loginAgent(app, user.id);

    const res = await agent
      .post("/repo")
      .send({ owner: "acme", name: "my-app" })
      .expect(200);

    expect(res.body.repo).toEqual({ owner: "acme", name: "my-app" });
  });

  it("POST /repo rejects inaccessible repositories", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    const user = await seedUser(prisma);
    const agent = await loginAgent(app, user.id);

    await agent
      .post("/repo")
      .send({ owner: "missing", name: "repo" })
      .expect(400);
  });

  it("GET /streak returns stats when repo is linked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            commit: {
              author: { date: "2025-06-08T10:00:00Z" },
              message: "daily work",
            },
          },
        ],
      }),
    );

    const user = await prisma.user.create({
      data: {
        githubId: 424242,
        username: "streak-user",
        accessToken: "token",
        repoOwner: "acme",
        repoName: "my-app",
      },
    });
    const agent = await loginAgent(app, user.id);

    const res = await agent.get("/streak").expect(200);
    expect(res.body.configured).toBe(true);
    expect(res.body.stats.totalCommits).toBe(1);
  });

  it("GET /tracks/track-1/stages reflects user progress when logged in", async () => {
    const user = await seedUser(prisma, {
      currentStage: "stage-1-git-fundamentals",
    });
    const agent = await loginAgent(app, user.id);

    const res = await agent.get("/tracks/track-1/stages").expect(200);
    const current = res.body.stages.find(
      (s: { slug: string }) => s.slug === "stage-1-git-fundamentals",
    );
    expect(current?.status).toBe("current");
  });
});
