import { randomUUID } from 'node:crypto';
import type { Clock, IdGenerator, LogLevel, Logger } from '@bulwark/ports';

/* eslint-disable no-restricted-syntax -- this is the one place allowed to read the clock */
export class SystemClock implements Clock {
  nowIso(): string {
    return new Date().toISOString();
  }

  monotonicMs(): number {
    return performance.now();
  }
}
/* eslint-enable no-restricted-syntax */

/** A clock that returns a fixed instant, for reproducible reports and tests. */
export class FixedClock implements Clock {
  private elapsed = 0;

  constructor(
    private readonly iso: string,
    private readonly stepMs = 0,
  ) {}

  nowIso(): string {
    return this.iso;
  }

  monotonicMs(): number {
    const current = this.elapsed;
    this.elapsed += this.stepMs;
    return current;
  }
}

export class UuidIdGenerator implements IdGenerator {
  nextId(): string {
    return randomUUID();
  }
}

/** Sequential ids, so a run directory listing sorts in creation order. */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = 'run') {}

  nextId(): string {
    this.counter += 1;
    return `${this.prefix}-${String(this.counter).padStart(4, '0')}`;
  }
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/**
 * Line-oriented JSON logger.
 *
 * Structured output keeps a CI log greppable, and writing to stderr leaves stdout
 * free for the CLI's own machine-readable output.
 */
export class ConsoleLogger implements Logger {
  constructor(
    private readonly minLevel: LogLevel = 'info',
    private readonly context: Readonly<Record<string, unknown>> = {},
    private readonly sink: (line: string) => void = (line) => process.stderr.write(`${line}\n`),
  ) {}

  log(level: LogLevel, message: string, context: Readonly<Record<string, unknown>> = {}): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;
    this.sink(JSON.stringify({ level, message, ...this.context, ...context }));
  }

  child(context: Readonly<Record<string, unknown>>): Logger {
    return new ConsoleLogger(this.minLevel, { ...this.context, ...context }, this.sink);
  }
}

export class SilentLogger implements Logger {
  log(): void {
    // Intentionally does nothing.
  }

  child(): Logger {
    return this;
  }
}
