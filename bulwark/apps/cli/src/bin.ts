#!/usr/bin/env node
import { access, writeFile } from 'node:fs/promises';
import { Command, Option } from 'commander';
import { BulwarkError } from '@bulwark/ports';
import { DEFAULT_CONFIG_FILENAME } from './config-loader.js';
import { createDefaultContext } from './commands/context.js';
import type { CliContext } from './commands/context.js';
import { runCommand } from './commands/run.js';
import { captureCommand } from './commands/capture.js';
import { analyzeCommand } from './commands/analyze.js';
import { doctorCommand } from './commands/doctor.js';
import { initCommand } from './commands/init.js';
import { serveCommand } from './commands/serve.js';

/**
 * Wires the commands to argv.
 *
 * Command bodies return exit codes and take their dependencies as arguments; this file
 * is the only place that touches `process`, so everything below it stays testable.
 */
export function createProgram(context: CliContext): Command {
  const program = new Command();
  program
    .name('bulwark')
    .description('Deterministic visual design QA: compare a design export with a live page')
    .version('0.1.0')
    .showHelpAfterError();

  const configOption = new Option(
    '-c, --config <path>',
    'path to the Bulwark configuration file',
  ).default(DEFAULT_CONFIG_FILENAME);

  const formatOption = new Option('-f, --format <format>', 'output format')
    .choices(['pretty', 'json', 'lines'])
    .default('pretty');

  program
    .command('run')
    .description('capture the live page, compare it with the design and write a report')
    .addOption(configOption)
    .addOption(formatOption)
    .option('--no-color', 'disable ANSI colors')
    .option('--no-fail-on-defects', 'always exit 0, even when defects are found')
    .action(
      async (options: {
        config: string;
        format: 'pretty' | 'json' | 'lines';
        color: boolean;
        failOnDefects: boolean;
      }) => {
        const code = await runCommand(context, {
          configPath: options.config,
          format: options.format,
          color: options.color,
          failOnDefects: options.failOnDefects,
        });
        setExitCode(code);
      },
    );

  program
    .command('capture')
    .description('capture the live screenshot and DOM snapshot without analysing them')
    .addOption(configOption)
    .action(async (options: { config: string }) => {
      setExitCode(await captureCommand(context, { configPath: options.config }));
    });

  program
    .command('analyze')
    .description('analyse a previously captured screenshot and DOM snapshot')
    .addOption(configOption)
    .addOption(formatOption)
    .requiredOption('--live-image <path>', 'live screenshot from a previous capture')
    .requiredOption('--live-dom <path>', 'DOM snapshot from the same capture')
    .option('--design-image <path>', 'design export, overriding the configured path')
    .option('--no-color', 'disable ANSI colors')
    .option('--no-fail-on-defects', 'always exit 0, even when defects are found')
    .action(
      async (options: {
        config: string;
        format: 'pretty' | 'json' | 'lines';
        liveImage: string;
        liveDom: string;
        designImage?: string;
        color: boolean;
        failOnDefects: boolean;
      }) => {
        const code = await analyzeCommand(context, {
          configPath: options.config,
          liveImage: options.liveImage,
          liveDom: options.liveDom,
          ...(options.designImage === undefined ? {} : { designImage: options.designImage }),
          format: options.format,
          color: options.color,
          failOnDefects: options.failOnDefects,
        });
        setExitCode(code);
      },
    );

  program
    .command('doctor')
    .description('check that the services, fonts and design export a run needs are present')
    .addOption(configOption)
    .action(async (options: { config: string }) => {
      setExitCode(await doctorCommand(context, { configPath: options.config }));
    });

  program
    .command('init')
    .description('write a starter configuration file')
    .option('-o, --output <path>', 'where to write the config', DEFAULT_CONFIG_FILENAME)
    .option('-u, --url <url>', 'URL of the page to check', 'http://localhost:5173/')
    .option('-d, --design <path>', 'path to the design export', 'design/figma-screenshot.png')
    .option('--force', 'overwrite an existing file', false)
    .action(async (options: { output: string; url: string; design: string; force: boolean }) => {
      const code = await initCommand(context, {
        outputPath: options.output,
        url: options.url,
        designImagePath: options.design,
        force: options.force,
        writeFile: (path, contents) => writeFile(path, contents, 'utf8'),
        fileExists: async (path) => {
          try {
            await access(path);
            return true;
          } catch {
            return false;
          }
        },
      });
      setExitCode(code);
    });

  program
    .command('serve')
    .description('serve one run directory, with the overlay dashboard when it is built')
    .requiredOption('-r, --run <directory>', 'run directory holding report.json')
    .option('-p, --port <port>', 'port to listen on', '4180')
    .option('--dashboard <directory>', 'built dashboard directory')
    .option('--host <host>', 'interface to bind', '0.0.0.0')
    .action(async (options: { run: string; port: string; dashboard?: string; host: string }) => {
      const result = await serveCommand(context, {
        runDirectory: options.run,
        port: Number.parseInt(options.port, 10),
        host: options.host,
        ...(options.dashboard === undefined ? {} : { dashboardDirectory: options.dashboard }),
      });
      setExitCode(result.exitCode);
    });

  return program;
}

function setExitCode(code: number): void {
  process.exitCode = code;
}

export async function main(argv: readonly string[]): Promise<void> {
  const context = createDefaultContext();
  try {
    await createProgram(context).parseAsync([...argv]);
  } catch (error) {
    if (error instanceof BulwarkError) {
      context.stderr(`error: ${error.message}`);
      for (const [key, value] of Object.entries(error.context)) {
        if (key === 'service') continue;
        context.stderr(`  ${key}: ${formatContextValue(value)}`);
      }
    } else {
      context.stderr(
        `error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
    }
    process.exitCode = 1;
  }
}

function formatContextValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => `\n    - ${String(item)}`).join('');
  return String(value);
}

const isDirectInvocation = process.argv[1] !== undefined && import.meta.url.endsWith('bin.js');
if (isDirectInvocation) {
  await main(process.argv);
}
