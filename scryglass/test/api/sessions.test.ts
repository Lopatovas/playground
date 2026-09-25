import request from "supertest";
import { describe, expect, it } from "vitest";

import { testRuntime } from "../helpers.js";

describe("sessions API", () => {
  it("opens PR-01 with customerApi as the first key point", async () => {
    const { app } = testRuntime();
    const created = await request(app).post("/api/sessions").send({ prId: "PR-01" }).expect(201);
    expect(created.body.session.report.risk).toBe("spine");
    expect(created.body.session.report.keyPoints[0]).toBe("src/api/customerApi.ts");
    expect(created.body.session.report.jev).toBeNull();
    expect(created.body.session.report.deterministic).toBe(true);

    const listed = await request(app).get("/api/sessions").expect(200);
    expect(listed.body.sessions).toHaveLength(1);

    const fetched = await request(app).get(`/api/sessions/${created.body.session.id}`).expect(200);
    expect(fetched.body.session.id).toBe(created.body.session.id);
  });

  it("resumes the same session id on a second open", async () => {
    const { app } = testRuntime();
    const first = await request(app).post("/api/sessions").send({ prId: "PR-02" }).expect(201);
    const second = await request(app).post("/api/sessions").send({ prId: "PR-02" }).expect(201);
    expect(second.body.session.id).toBe(first.body.session.id);
  });

  it("records a sitting so the next open can show what is new", async () => {
    const { app } = testRuntime();
    const opened = await request(app).post("/api/sessions").send({ prId: "PR-04" }).expect(201);
    const closed = await request(app)
      .post(`/api/sessions/${opened.body.session.id}/sittings`)
      .expect(201);
    expect(closed.body.session.lastSittingAt).toBeTruthy();
    expect(closed.body.session.sittings[0].changedFiles).toContain(
      "src/pages/MarketingLandingPage.ts",
    );
  });

  it("rejects unknown PRs", async () => {
    const { app } = testRuntime();
    await request(app).post("/api/sessions").send({ prId: "PR-99" }).expect(404);
  });

  it("refuses a Bitbucket URL when credentials are missing", async () => {
    const { app } = testRuntime();
    const res = await request(app)
      .post("/api/sessions")
      .send({ url: "https://bitbucket.org/acme/shop/pull-requests/1" })
      .expect(400);
    expect(res.body.error).toMatch(/BITBUCKET_TOKEN|BITBUCKET_USERNAME/);
  });

  it("health reports fixtures-only until Bitbucket credentials are set", async () => {
    const { app } = testRuntime();
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body.hosts.bitbucket).toBe(false);
    expect(res.body.hosts.reachable).toBeNull();
    expect(res.body.hosts.hint).toMatch(/Fixtures only/);
  });

  it("health says connect the VPN when a configured host cannot be resolved", async () => {
    const { app } = testRuntime({
      BITBUCKET_TOKEN: "test-token",
      BITBUCKET_URL: "https://bb.internal.invalid",
    });
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body.hosts.bitbucket).toBe(true);
    expect(res.body.hosts.bitbucketEdition).toBe("datacenter");
    expect(res.body.hosts.reachable).toBe(false);
    expect(res.body.hosts.hint).toMatch(/VPN|Can't resolve|Can't reach/);
  });

  it("opening a Data Center URL fails closed with a VPN hint when the host is unreachable", async () => {
    const { app } = testRuntime({
      BITBUCKET_TOKEN: "test-token",
      BITBUCKET_URL: "https://bb.internal.invalid",
    });
    const res = await request(app)
      .post("/api/sessions")
      .send({ url: "https://bb.internal.invalid/projects/FE/repos/app/pull-requests/3" })
      .expect(503);
    expect(res.body.error).toMatch(/VPN|Can't resolve|Can't reach/);
  });
});
