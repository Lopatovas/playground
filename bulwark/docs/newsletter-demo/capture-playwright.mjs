import { pathToFileURL } from "url";
import { join, dirname } from "path";
import { copyFileSync } from "fs";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const pwPkg = join(
  root,
  "node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs",
);
const { chromium } = await import(pathToFileURL(pwPkg).href);
const dest = join(root, "docs/newsletter-demo");

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function capture(dpr, suffix) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: dpr,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:8765/collage.html", {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() =>
    [...document.images].every((i) => i.complete && i.naturalWidth > 0),
  );

  for (const [id, file] of [
    ["frame-compare", `30-newsletter-design-vs-live${suffix}.png`],
    ["frame-defects", `31-newsletter-defects${suffix}.png`],
    ["frame-complex", `32-newsletter-complex${suffix}.png`],
  ]) {
    await page.evaluate((frameId) => {
      document
        .querySelectorAll(".frame")
        .forEach((f) => f.classList.remove("is-active"));
      document.getElementById(frameId).classList.add("is-active");
    }, id);
    await page.waitForTimeout(300);
    const out = join(dest, file);
    await page.screenshot({ path: out, type: "png", fullPage: false });
    console.log("wrote", file);
  }
  await context.close();
}

await capture(1, "");
await capture(2, "@2x");
await browser.close();

copyFileSync(
  join(dest, "30-newsletter-design-vs-live.png"),
  join(dest, "01-dashboard-runs.png"),
);
copyFileSync(
  join(dest, "30-newsletter-design-vs-live.png"),
  join(dest, "06-landing-overlay-opacity.png"),
);
copyFileSync(
  join(dest, "30-newsletter-design-vs-live.png"),
  join(dest, "06b-landing-overlay-wide.png"),
);
copyFileSync(
  join(dest, "31-newsletter-defects.png"),
  join(dest, "07-landing-curtain.png"),
);
copyFileSync(
  join(dest, "32-newsletter-complex.png"),
  join(dest, "09-complex-overlay.png"),
);
console.log("aliases synced");
