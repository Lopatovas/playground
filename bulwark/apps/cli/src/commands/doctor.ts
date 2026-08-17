import { OmniParserDetector, PaddleOcrRecognizer } from '@bulwark/adapters';
import type { CliContext } from './context.js';

export interface DoctorCommandOptions {
  readonly configPath: string;
}

export interface CheckResult {
  readonly name: string;
  readonly ok: boolean;
  readonly detail: string;
}

export const EXIT_UNHEALTHY = 2;

/**
 * Verifies that everything a run depends on is actually present.
 *
 * Each dependency fails in its own way — a model still loading, a font that silently
 * substitutes, a design export that was never committed — and each produces a
 * confusing defect report rather than an obvious error. Checking them up front turns
 * all of those into one clear message.
 */
export async function doctorCommand(
  context: CliContext,
  options: DoctorCommandOptions,
): Promise<number> {
  const loaded = await context.loadConfig(options.configPath);
  const checks: CheckResult[] = [];

  checks.push(await checkDesignExport(context, loaded.designImagePath));
  checks.push(await checkDetector(loaded.config.services.detector.baseUrl));

  if (loaded.config.services.recognizer.kind === 'paddleocr') {
    checks.push(await checkRecognizer(loaded.config.services.recognizer.baseUrl));
  } else {
    checks.push({
      name: 'text recognizer',
      ok: true,
      detail: 'ink-projection (local, no service required)',
    });
  }

  if (loaded.config.services.rasterizer.kind === 'playwright') {
    checks.push(await checkFonts(loaded.config.typography.candidateFamilies));
  } else {
    checks.push({
      name: 'reference renderer',
      ok: true,
      detail: 'disabled (the font-family check will not run)',
    });
  }

  checks.push(await checkTarget(loaded.config.target.url));

  for (const check of checks) {
    context.stdout(`${check.ok ? 'ok  ' : 'fail'} ${check.name}: ${check.detail}`);
  }

  return checks.every((check) => check.ok) ? 0 : EXIT_UNHEALTHY;
}

async function checkDesignExport(context: CliContext, path: string): Promise<CheckResult> {
  try {
    const bytes = await context.readBinaryFile(path);
    return {
      name: 'design export',
      ok: true,
      detail: `${path} (${formatBytes(bytes.byteLength)})`,
    };
  } catch {
    return { name: 'design export', ok: false, detail: `cannot read ${path}` };
  }
}

async function checkDetector(baseUrl: string): Promise<CheckResult> {
  try {
    const health = await new OmniParserDetector({
      baseUrl,
      maxAttempts: 1,
      timeoutMs: 5000,
    }).health();
    return {
      name: 'element detector',
      ok: true,
      detail: health.weightsLoaded
        ? `${baseUrl} serving ${health.model}`
        : `${baseUrl} serving ${health.model} in fallback mode without model weights`,
    };
  } catch (error) {
    return { name: 'element detector', ok: false, detail: `${baseUrl}: ${describe(error)}` };
  }
}

async function checkRecognizer(baseUrl: string): Promise<CheckResult> {
  try {
    const health = await new PaddleOcrRecognizer({
      baseUrl,
      maxAttempts: 1,
      timeoutMs: 5000,
    }).health();
    return { name: 'text recognizer', ok: true, detail: `${baseUrl} serving ${health.model}` };
  } catch (error) {
    return { name: 'text recognizer', ok: false, detail: `${baseUrl}: ${describe(error)}` };
  }
}

async function checkFonts(families: readonly string[]): Promise<CheckResult> {
  try {
    const { PlaywrightTextRasterizer } = await import('@bulwark/adapters');
    const rasterizer = new PlaywrightTextRasterizer({ expectedFamilies: families });
    const available = (await rasterizer.listAvailableFamilies?.()) ?? [];
    await rasterizer.close();

    const missing = families.filter((family) => !available.includes(family));
    return {
      name: 'reference renderer',
      ok: missing.length === 0,
      detail:
        missing.length === 0
          ? `all candidate families available: ${families.join(', ')}`
          : `missing font(s): ${missing.join(', ')}`,
    };
  } catch (error) {
    return { name: 'reference renderer', ok: false, detail: describe(error) };
  }
}

async function checkTarget(url: string): Promise<CheckResult> {
  try {
    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
    return {
      name: 'target page',
      ok: response.ok,
      detail: `${url} responded ${response.status}`,
    };
  } catch (error) {
    return { name: 'target page', ok: false, detail: `${url}: ${describe(error)}` };
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}
