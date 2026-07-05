import { afterEach, describe, expect, it } from "vitest";
import {
  assertProductionConfig,
  GITHUB_REPO_NAME_PATTERN,
  loadAppConfig,
  parseMentorGithubIds,
} from "./env.js";

describe("env config", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it("parses mentor github ids", () => {
    expect(parseMentorGithubIds("900001, 900002")).toEqual(
      new Set([900001, 900002]),
    );
    expect(parseMentorGithubIds("")).toEqual(new Set());
  });

  it("rejects insecure session secret in production", () => {
    process.env.NODE_ENV = "production";
    const config = loadAppConfig({ apiPort: 3001, rootDir: "/tmp" });
    expect(() => assertProductionConfig(config)).toThrow(/SESSION_SECRET/);
  });

  it("rejects missing GitHub OAuth in production", () => {
    process.env.NODE_ENV = "production";
    const config = {
      ...loadAppConfig({ apiPort: 3001, rootDir: "/tmp" }),
      sessionSecret: "a".repeat(64),
      githubClientId: "",
      githubClientSecret: "",
    };
    expect(() => assertProductionConfig(config)).toThrow(/GITHUB_CLIENT_ID/);
  });

  it("accepts valid production config", () => {
    process.env.NODE_ENV = "production";
    const config = {
      ...loadAppConfig({ apiPort: 3001, rootDir: "/tmp" }),
      sessionSecret: "a".repeat(64),
      githubClientId: "client",
      githubClientSecret: "secret",
    };
    expect(() => assertProductionConfig(config)).not.toThrow();
  });

  it("validates github repo name pattern", () => {
    expect(GITHUB_REPO_NAME_PATTERN.test("my-app")).toBe(true);
    expect(GITHUB_REPO_NAME_PATTERN.test("user.name")).toBe(true);
    expect(GITHUB_REPO_NAME_PATTERN.test("../evil")).toBe(false);
    expect(GITHUB_REPO_NAME_PATTERN.test("")).toBe(false);
  });
});
