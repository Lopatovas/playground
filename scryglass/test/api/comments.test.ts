import { readFileSync } from "node:fs";
import { join } from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { testRuntime } from "../helpers.js";

describe("comment API", () => {
  it("rejects empty drafts", async () => {
    const { app } = testRuntime();
    const opened = await request(app).post("/api/sessions").send({ prId: "PR-02" }).expect(201);
    await request(app)
      .post(`/api/sessions/${opened.body.session.id}/comments`)
      .send({ body: "   " })
      .expect(400);
  });

  it("persists a draft across resume", async () => {
    const { app } = testRuntime();
    const opened = await request(app).post("/api/sessions").send({ prId: "PR-02" }).expect(201);
    await request(app)
      .post(`/api/sessions/${opened.body.session.id}/comments`)
      .send({ body: "heading is leaf", file: "src/components/SettingsHeading.ts", line: 1 })
      .expect(201);
    const resumed = await request(app).post("/api/sessions").send({ prId: "PR-02" }).expect(201);
    expect(resumed.body.session.comments).toHaveLength(1);
    expect(resumed.body.session.comments[0].body).toBe("heading is leaf");
    expect(resumed.body.session.comments[0].status).toBe("draft");
  });

  it("publishes drafts onto the pull request, never a commit", async () => {
    const { app, home } = testRuntime();
    const opened = await request(app).post("/api/sessions").send({ prId: "PR-01" }).expect(201);
    await request(app)
      .post(`/api/sessions/${opened.body.session.id}/comments`)
      .send({ body: "shared API first" })
      .expect(201);
    const published = await request(app)
      .post(`/api/sessions/${opened.body.session.id}/publish`)
      .send({})
      .expect(200);

    expect(published.body.session.comments).toHaveLength(0);
    expect(published.body.session.published).toHaveLength(1);
    expect(published.body.session.published[0].publishTarget).toBe("pullrequest");
    expect(published.body.session.published[0].hostCommentId).toMatch(/^fixture-PR-01-/);

    const recorded = JSON.parse(readFileSync(join(home, "published", "PR-01.json"), "utf8")) as {
      target: string;
      comments: { destination: string }[];
    };
    expect(recorded.target).toBe("pullrequest");
    expect(recorded.comments.every((comment) => comment.destination === "pullrequest")).toBe(true);
    expect(JSON.stringify(recorded)).not.toContain("commit");
  });
});
