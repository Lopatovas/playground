import { describe, expect, it } from "vitest";
import {
  ALLOWED_API_CALLERS,
  ALLOWED_CROSS_FEATURE_SERVICE_IMPORTS,
  API_FEATURES,
  API_SRC,
  API_SRC_ROOT_ALLOWLIST,
  PROTECTED_WEB_ROUTES,
  WEB_FEATURES,
  WEB_ROOT,
} from "./paths.js";
import {
  featureFromApiPath,
  featureFromWebPath,
  formatViolation,
  isApiRoutesFile,
  isApiServiceFile,
  isWebPageFile,
  listChildDirs,
  parseImportSpecifiers,
  pathExists,
  readText,
  resolveImports,
  usesApiClient,
  walkDir,
} from "./scan.js";

function expectNoViolations(violations: string[]) {
  expect(violations, violations.join("\n")).toEqual([]);
}

describe("CommitLoop API architecture", () => {
  it("keeps only bootstrap files at api/src root", () => {
    const rootFiles = walkDir(API_SRC, { extensions: [".ts"] }).filter(
      (file) => file.split("/").length === 3,
    );

    const violations = rootFiles
      .filter((file) => !API_SRC_ROOT_ALLOWLIST.has(file))
      .map((file) =>
        formatViolation(
          file,
          "api/src root must only contain app.ts, index.ts, and app.integration.test.ts",
        ),
      );

    expectNoViolations(violations);
  });

  it("registers only known API feature domains", () => {
    const discovered = listChildDirs(`${API_SRC}/features`);
    expect(discovered).toEqual([...API_FEATURES].sort());
  });

  it("requires each API feature to expose a routes module", () => {
    const violations = API_FEATURES.flatMap((feature) => {
      const routesFile = `${API_SRC}/features/${feature}/${feature}.routes.ts`;
      if (pathExists(routesFile)) return [];
      return [
        formatViolation(
          `${API_SRC}/features/${feature}`,
          `missing required ${feature}.routes.ts`,
        ),
      ];
    });

    expectNoViolations(violations);
  });

  it("keeps services free of Express imports", () => {
    const serviceFiles = walkDir(API_SRC, { extensions: [".ts"] }).filter(
      isApiServiceFile,
    );

    const violations = serviceFiles.flatMap((file) =>
      parseImportSpecifiers(readText(file))
        .filter((specifier) => specifier === "express")
        .map(() =>
          formatViolation(file, "feature services must not import Express"),
        ),
    );

    expectNoViolations(violations);
  });

  it("prevents feature routes from importing other feature routes", () => {
    const routeFiles = walkDir(API_SRC, { extensions: [".ts"] }).filter(
      isApiRoutesFile,
    );

    const violations = routeFiles.flatMap((file) =>
      resolveImports(file)
        .filter((resolved) => isApiRoutesFile(resolved))
        .map((resolved) =>
          formatViolation(
            file,
            `routes must not import other route modules (${resolved})`,
          ),
        ),
    );

    expectNoViolations(violations);
  });

  it("prevents services from importing route modules", () => {
    const serviceFiles = walkDir(API_SRC, { extensions: [".ts"] }).filter(
      isApiServiceFile,
    );

    const violations = serviceFiles.flatMap((file) =>
      resolveImports(file)
        .filter((resolved) => resolved.includes(".routes."))
        .map((resolved) =>
          formatViolation(
            file,
            `services must not import route modules (${resolved})`,
          ),
        ),
    );

    expectNoViolations(violations);
  });

  it("prevents clients and middleware from importing feature routes", () => {
    const guardedFiles = walkDir(API_SRC, { extensions: [".ts"] }).filter(
      (file) =>
        file.startsWith("api/src/clients/") ||
        file.startsWith("api/src/middleware/") ||
        file.startsWith("api/src/config/"),
    );

    const violations = guardedFiles.flatMap((file) =>
      resolveImports(file)
        .filter((resolved) => resolved.includes("/features/"))
        .map((resolved) =>
          formatViolation(
            file,
            `infrastructure layer must not import features (${resolved})`,
          ),
        ),
    );

    expectNoViolations(violations);
  });

  it("allows only whitelisted cross-feature service dependencies", () => {
    const serviceFiles = walkDir(API_SRC, { extensions: [".ts"] }).filter(
      isApiServiceFile,
    );

    const violations = serviceFiles.flatMap((file) => {
      const ownFeature = featureFromApiPath(file);
      return resolveImports(file)
        .filter((resolved) => resolved.includes("/features/"))
        .filter((resolved) => isApiServiceFile(resolved))
        .filter((resolved) => featureFromApiPath(resolved) !== ownFeature)
        .filter(
          (resolved) => !ALLOWED_CROSS_FEATURE_SERVICE_IMPORTS.has(`${file}->${resolved}`),
        )
        .map((resolved) =>
          formatViolation(
            file,
            `cross-feature service import not allowed (${resolved}); update architecture allowlist intentionally`,
          ),
        );
    });

    expectNoViolations(violations);
  });

  it("mounts feature routers only from app.ts", () => {
    const sourceFiles = walkDir(API_SRC, { extensions: [".ts"] }).filter(
      (file) => !file.endsWith(".test.ts"),
    );

    const violations = sourceFiles
      .filter((file) => file !== "api/src/app.ts")
      .filter((file) => /app\.use\(create[A-Za-z]+Router/.test(readText(file)))
      .map((file) =>
        formatViolation(
          file,
          "feature routers must only be mounted in api/src/app.ts",
        ),
      );

    expectNoViolations(violations);
  });

  it("registers every API feature router in app.ts", () => {
    const appSource = readText("api/src/app.ts");

    const violations = API_FEATURES.flatMap((feature) => {
      const factory = `create${feature[0].toUpperCase()}${feature.slice(1)}Router`;
      if (appSource.includes(factory)) return [];

      return [
        formatViolation(
          "api/src/app.ts",
          `missing ${factory} import or mount`,
        ),
      ];
    });

    expectNoViolations(violations);
  });
});

describe("CommitLoop web architecture", () => {
  it("does not implement domain logic in Next.js API routes", () => {
    expect(pathExists("web/app/api")).toBe(false);
  });

  it("registers only known web feature domains", () => {
    const discovered = listChildDirs(`${WEB_ROOT}/features`);
    expect(discovered).toEqual([...WEB_FEATURES].sort());
  });

  it("keeps protected routes inside the (app) route group", () => {
    const violations = PROTECTED_WEB_ROUTES.flatMap((route) => {
      const protectedPath = `web/app/(app)/${route}/page.tsx`;
      const legacyPath = `web/app/${route}/page.tsx`;

      const errors: string[] = [];
      if (!pathExists(protectedPath)) {
        errors.push(
          formatViolation(
            protectedPath,
            `protected route /${route} must exist under app/(app)/`,
          ),
        );
      }
      if (pathExists(legacyPath)) {
        errors.push(
          formatViolation(
            legacyPath,
            `duplicate unprotected route; remove in favor of app/(app)/${route}`,
          ),
        );
      }
      return errors;
    });

    expectNoViolations(violations);
  });

  it("prevents feature modules from importing app pages", () => {
    const featureFiles = walkDir(`${WEB_ROOT}/features`, {
      extensions: [".ts", ".tsx"],
    }).filter((file) => !file.endsWith(".test.tsx"));

    const violations = featureFiles.flatMap((file) =>
      resolveImports(file)
        .filter((resolved) => resolved.startsWith("web/app/"))
        .map((resolved) =>
          formatViolation(
            file,
            `features must not import app routes (${resolved})`,
          ),
        ),
    );

    expectNoViolations(violations);
  });

  it("prevents cross-feature imports in web/features", () => {
    const featureFiles = walkDir(`${WEB_ROOT}/features`, {
      extensions: [".ts", ".tsx"],
    }).filter((file) => !file.endsWith(".test.tsx"));

    const violations = featureFiles.flatMap((file) => {
      const ownFeature = featureFromWebPath(file);
      return resolveImports(file)
        .filter((resolved) => resolved.startsWith("web/features/"))
        .filter((resolved) => featureFromWebPath(resolved) !== ownFeature)
        .map((resolved) =>
          formatViolation(
            file,
            `cross-feature imports must be composed in app pages (${resolved})`,
          ),
        );
    });

    expectNoViolations(violations);
  });

  it("restricts API client usage to app pages, lib, and app header", () => {
    const sourceFiles = walkDir(WEB_ROOT, {
      extensions: [".ts", ".tsx"],
    }).filter(
      (file) =>
        !file.endsWith(".test.ts") &&
        !file.endsWith(".test.tsx") &&
        file !== "web/lib/api.ts",
    );

    const violations = sourceFiles
      .filter((file) => usesApiClient(file))
      .filter((file) => {
        if (ALLOWED_API_CALLERS.has(file)) return false;
        if (file.startsWith("web/app/") && isWebPageFile(file)) return false;
        return true;
      })
      .map((file) =>
        formatViolation(
          file,
          "API calls must live in web/app pages, web/lib, or components/app-header.tsx",
        ),
      );

    expectNoViolations(violations);
  });
});
