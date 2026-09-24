import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createRuntime } from "../src/foundry/container.js";
import { fixturesRoot, loomShopRoot } from "../src/foundry/paths.js";

export function tempHome(): string {
  return mkdtempSync(join(tmpdir(), "scryglass-"));
}

export function testRuntime() {
  const home = tempHome();
  return {
    ...createRuntime({ home, shopRoot: loomShopRoot(), fixturesDir: fixturesRoot() }),
    home,
  };
}
