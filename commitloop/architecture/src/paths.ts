import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));

export const COMMITLOOP_ROOT = path.resolve(DIR, "../..");
export const API_SRC = "api/src";
export const WEB_ROOT = "web";

export const API_FEATURES = [
  "assignment",
  "auth",
  "curriculum",
  "health",
  "repo",
  "streak",
  "user",
] as const;

export const WEB_FEATURES = [
  "assignment",
  "curriculum",
  "dashboard",
  "landing",
  "repo",
  "settings",
] as const;

export const PROTECTED_WEB_ROUTES = ["home", "assignment", "settings"] as const;

export const API_SRC_ROOT_ALLOWLIST = new Set([
  "api/src/app.ts",
  "api/src/index.ts",
  "api/src/app.integration.test.ts",
]);

export const ALLOWED_CROSS_FEATURE_SERVICE_IMPORTS = new Set([
  "api/src/features/assignment/assignment.service.ts->api/src/features/curriculum/curriculum.service.ts",
]);

export const ALLOWED_API_CALLERS = new Set([
  "web/lib/api.ts",
  "web/lib/auth.tsx",
  "web/components/app-header.tsx",
]);
