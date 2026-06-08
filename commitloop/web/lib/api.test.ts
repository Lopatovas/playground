import { afterEach, describe, expect, it, vi } from "vitest";
import { api, apiRequest } from "./api";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "user-1" }),
      }),
    );

    const data = await apiRequest<{ id: string }>("/me");
    expect(data).toEqual({ id: "user-1" });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/me"),
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("throws API error message from JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Not authenticated" }),
      }),
    );

    await expect(apiRequest("/me")).rejects.toThrow("Not authenticated");
  });

  it("falls back to HTTP status when body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("invalid json");
        },
      }),
    );

    await expect(apiRequest("/me")).rejects.toThrow("HTTP 500");
  });
});

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes typed endpoint helpers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ trackId: "track-1", stages: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.trackStages();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/tracks/track-1/stages"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds the GitHub login URL from the API base", () => {
    expect(api.githubLoginUrl()).toContain("/auth/github");
  });

  it.each([
    ["me", () => api.me(), "/me", "GET"],
    ["logout", () => api.logout(), "/auth/logout", "POST"],
    [
      "setRepo",
      () => api.setRepo("acme", "app"),
      "/repo",
      "POST",
    ],
    ["streak", () => api.streak(), "/streak", "GET"],
    [
      "assignment",
      () => api.assignment(),
      "/assignment/current",
      "GET",
    ],
    [
      "setStep",
      () => api.setStep("lesson"),
      "/assignment/step",
      "POST",
    ],
    [
      "toggleChecklist",
      () => api.toggleChecklist("item-1", true),
      "/assignment/checklist",
      "POST",
    ],
    [
      "advanceStage",
      () => api.advanceStage(),
      "/assignment/advance",
      "POST",
    ],
  ] as const)("calls %s", async (_name, call, path, method) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    await call();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock.mock.calls[0]?.[0]).toContain(path);
    if (method !== "GET") {
      expect(init.method).toBe(method);
    }
  });
});
