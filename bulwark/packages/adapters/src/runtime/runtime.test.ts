import { describe, expect, it } from 'vitest';
import {
  ConsoleLogger,
  FixedClock,
  SequentialIdGenerator,
  SilentLogger,
  SystemClock,
  UuidIdGenerator,
} from './runtime.js';

describe('SystemClock', () => {
  it('returns an ISO timestamp and a monotonic reading', () => {
    const clock = new SystemClock();
    expect(clock.nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    const first = clock.monotonicMs();
    expect(clock.monotonicMs()).toBeGreaterThanOrEqual(first);
  });
});

describe('FixedClock', () => {
  it('returns the same instant every time, so reports are reproducible', () => {
    const clock = new FixedClock('2026-01-15T10:00:00.000Z');
    expect(clock.nowIso()).toBe('2026-01-15T10:00:00.000Z');
    expect(clock.nowIso()).toBe('2026-01-15T10:00:00.000Z');
  });

  it('advances the monotonic reading by a fixed step so durations are predictable', () => {
    const clock = new FixedClock('2026-01-15T10:00:00.000Z', 25);
    expect(clock.monotonicMs()).toBe(0);
    expect(clock.monotonicMs()).toBe(25);
    expect(clock.monotonicMs()).toBe(50);
  });
});

describe('id generators', () => {
  it('produces unique uuids', () => {
    const generator = new UuidIdGenerator();
    expect(generator.nextId()).not.toBe(generator.nextId());
    expect(generator.nextId()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('produces zero-padded sequential ids that sort correctly', () => {
    const generator = new SequentialIdGenerator('run');
    expect([generator.nextId(), generator.nextId()]).toEqual(['run-0001', 'run-0002']);
  });
});

describe('ConsoleLogger', () => {
  it('emits one JSON object per line', () => {
    const lines: string[] = [];
    new ConsoleLogger('info', {}, (line) => lines.push(line)).log('warn', 'slow capture', {
      ms: 900,
    });

    expect(JSON.parse(lines[0] as string)).toEqual({
      level: 'warn',
      message: 'slow capture',
      ms: 900,
    });
  });

  it('filters below the configured level', () => {
    const lines: string[] = [];
    const logger = new ConsoleLogger('warn', {}, (line) => lines.push(line));
    logger.log('debug', 'noise');
    logger.log('info', 'progress');
    logger.log('error', 'failure');

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('failure');
  });

  it('merges child context, with the call site winning', () => {
    const lines: string[] = [];
    const logger = new ConsoleLogger('info', { runId: 'r1' }, (line) => lines.push(line));
    logger.child({ stage: 'capture' }).log('info', 'started', { stage: 'analyze' });

    expect(JSON.parse(lines[0] as string)).toEqual({
      level: 'info',
      message: 'started',
      runId: 'r1',
      stage: 'analyze',
    });
  });
});

describe('SilentLogger', () => {
  it('accepts calls and returns itself for children', () => {
    const logger = new SilentLogger();
    expect(() => logger.log('error', 'ignored')).not.toThrow();
    expect(logger.child({})).toBe(logger);
  });
});
