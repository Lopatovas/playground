import type { BulwarkConfigInput } from '@bulwark/pipeline';
import type { CliContext } from './context.js';

export interface InitCommandOptions {
  readonly outputPath: string;
  readonly url: string;
  readonly designImagePath: string;
  readonly force: boolean;
  readonly writeFile: (path: string, contents: string) => Promise<void>;
  readonly fileExists: (path: string) => Promise<boolean>;
}

/** Configuration written by `bulwark init`, with every default made explicit. */
export function starterConfig(options: {
  readonly url: string;
  readonly designImagePath: string;
}): BulwarkConfigInput {
  return {
    name: 'design-qa',
    target: {
      url: options.url,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      fullPage: false,
      settleMs: 250,
      stabilize: true,
    },
    design: {
      imagePath: options.designImagePath,
      pixelRatio: 1,
      flattenBackground: '#ffffff',
    },
    services: {
      detector: { kind: 'omniparser', baseUrl: 'http://localhost:8801' },
      recognizer: { kind: 'ink-projection' },
      rasterizer: { kind: 'disabled' },
      cacheDir: '.bulwark-cache',
    },
    tolerances: {
      spacingPx: 2,
      positionPx: 2,
      fontSizePx: 1,
      deltaE: 2,
      minFamilyMargin: 0.02,
    },
    typography: { candidateFamilies: ['Mark Pro', 'Open Sans'] },
    output: { artifactsDir: '.artifacts', failOnDefects: true },
  };
}

export async function initCommand(
  context: CliContext,
  options: InitCommandOptions,
): Promise<number> {
  if (!options.force && (await options.fileExists(options.outputPath))) {
    context.stderr(
      `${options.outputPath} already exists. Pass --force to overwrite it.`,
    );
    return 1;
  }

  const config = starterConfig({ url: options.url, designImagePath: options.designImagePath });
  await options.writeFile(options.outputPath, `${JSON.stringify(config, null, 2)}\n`);

  context.stdout(`wrote ${options.outputPath}`);
  context.stdout(`  1. export your Figma frame to ${options.designImagePath}`);
  context.stdout('  2. start the vision services with "docker compose up"');
  context.stdout('  3. run "bulwark doctor" and then "bulwark run"');
  return 0;
}
