/**
 * A source of the current time.
 *
 * Reports embed a timestamp, and tests need that timestamp to be predictable, so the
 * wall clock is a dependency like any other.
 */
export interface Clock {
  nowIso(): string;
  /** Monotonic milliseconds, for measuring durations. */
  monotonicMs(): number;
}

export interface IdGenerator {
  nextId(): string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  log(level: LogLevel, message: string, context?: Readonly<Record<string, unknown>>): void;
  child(context: Readonly<Record<string, unknown>>): Logger;
}

/**
 * Byte and JSON storage for one run's artifacts.
 *
 * Paths are relative to the run's own directory, which is what lets a report be
 * copied or served from anywhere without rewriting the paths inside it.
 */
export interface ArtifactStore {
  readonly rootPath: string;
  write(relativePath: string, bytes: Uint8Array): Promise<string>;
  writeText(relativePath: string, text: string): Promise<string>;
  read(relativePath: string): Promise<Uint8Array>;
  readText(relativePath: string): Promise<string>;
  exists(relativePath: string): Promise<boolean>;
  list(relativeDirectory?: string): Promise<readonly string[]>;
  /** Absolute path, for logs and CLI output only. */
  resolve(relativePath: string): string;
}

/** Cache used to replay expensive vision-service calls byte-for-byte. */
export interface ResponseCache {
  get(key: string): Promise<Uint8Array | null>;
  set(key: string, value: Uint8Array): Promise<void>;
}
