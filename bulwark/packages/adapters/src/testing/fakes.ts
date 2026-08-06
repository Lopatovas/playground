import type {
  ArtifactStore,
  DetectionRequest,
  DetectionResult,
  ElementDetector,
  LiveCapture,
  LiveCaptureRequest,
  LiveInspector,
  Logger,
  LogLevel,
  ResponseCache,
  TextRasterizer,
  TextRecognitionRequest,
  TextRecognitionResult,
  TextRecognizer,
  TextRenderRequest,
  TextRenderResult,
} from '@bulwark/ports';
import { BulwarkError, MissingArtifactError } from '@bulwark/ports';
import { sha256 } from '../vision/caching.js';

/**
 * In-memory implementations of every port.
 *
 * They let the pipeline be tested end to end with exact, hand-written inputs — no
 * model weights, no browser, no network — which is the only way the measurement math
 * can be asserted against known values rather than against whatever the services
 * happened to return.
 */

export class FakeElementDetector implements ElementDetector {
  readonly name: string;
  readonly requests: DetectionRequest[] = [];

  constructor(
    private readonly responses: ReadonlyMap<string, DetectionResult>,
    name = 'fake-detector',
  ) {
    this.name = name;
  }

  /** Keys responses by surface, which is enough for most tests. */
  static bySurface(
    design: DetectionResult,
    live: DetectionResult,
    name?: string,
  ): FakeElementDetector {
    return new FakeElementDetector(
      new Map([
        ['design', design],
        ['live', live],
      ]),
      name,
    );
  }

  detect(request: DetectionRequest): Promise<DetectionResult> {
    this.requests.push(request);
    const bySurface = this.responses.get(request.surface);
    const byHash = this.responses.get(sha256(request.image));
    const response = byHash ?? bySurface;
    if (response === undefined) {
      throw new BulwarkError(`FakeElementDetector has no response for surface "${request.surface}"`);
    }
    return Promise.resolve(response);
  }
}

export class FakeTextRecognizer implements TextRecognizer {
  readonly name = 'fake-recognizer';
  readonly requests: TextRecognitionRequest[] = [];

  constructor(private readonly response: TextRecognitionResult) {}

  recognize(request: TextRecognitionRequest): Promise<TextRecognitionResult> {
    this.requests.push(request);
    return Promise.resolve(this.response);
  }
}

export class FakeLiveInspector implements LiveInspector {
  readonly name = 'fake-inspector';
  readonly requests: LiveCaptureRequest[] = [];

  constructor(private readonly capture0: LiveCapture) {}

  capture(request: LiveCaptureRequest): Promise<LiveCapture> {
    this.requests.push(request);
    return Promise.resolve({ ...this.capture0, url: request.url, viewport: request.viewport });
  }
}

export interface FakeRenderKey {
  readonly fontFamily: string;
  readonly text: string;
}

export class FakeTextRasterizer implements TextRasterizer {
  readonly name = 'fake-rasterizer';
  readonly requests: TextRenderRequest[] = [];

  constructor(
    private readonly renders: ReadonlyMap<string, TextRenderResult>,
    private readonly families: readonly string[] = [],
  ) {}

  static keyFor(key: FakeRenderKey): string {
    return `${key.fontFamily}::${key.text}`;
  }

  render(request: TextRenderRequest): Promise<TextRenderResult> {
    this.requests.push(request);
    const byFamilyAndText = this.renders.get(
      FakeTextRasterizer.keyFor({ fontFamily: request.fontFamily, text: request.text }),
    );
    const byFamily = this.renders.get(request.fontFamily);
    const render = byFamilyAndText ?? byFamily;
    if (render === undefined) {
      throw new BulwarkError(
        `FakeTextRasterizer has no render for "${request.text}" in ${request.fontFamily}`,
      );
    }
    return Promise.resolve(render);
  }

  listAvailableFamilies(): Promise<readonly string[]> {
    return Promise.resolve(this.families);
  }
}

export class MemoryArtifactStore implements ArtifactStore {
  readonly rootPath = '/memory';
  readonly files = new Map<string, Uint8Array>();

  resolve(relativePath: string): string {
    return `${this.rootPath}/${relativePath}`;
  }

  write(relativePath: string, bytes: Uint8Array): Promise<string> {
    this.files.set(normalize(relativePath), new Uint8Array(bytes));
    return Promise.resolve(this.resolve(relativePath));
  }

  writeText(relativePath: string, text: string): Promise<string> {
    return this.write(relativePath, Buffer.from(text, 'utf8'));
  }

  read(relativePath: string): Promise<Uint8Array> {
    const bytes = this.files.get(normalize(relativePath));
    if (bytes === undefined) {
      return Promise.reject(new MissingArtifactError(`Artifact "${relativePath}" is not present`));
    }
    return Promise.resolve(bytes);
  }

  async readText(relativePath: string): Promise<string> {
    return Buffer.from(await this.read(relativePath)).toString('utf8');
  }

  exists(relativePath: string): Promise<boolean> {
    return Promise.resolve(this.files.has(normalize(relativePath)));
  }

  list(relativeDirectory = '.'): Promise<readonly string[]> {
    const prefix = relativeDirectory === '.' ? '' : `${normalize(relativeDirectory)}/`;
    return Promise.resolve(
      [...this.files.keys()].filter((path) => path.startsWith(prefix)).sort(),
    );
  }
}

export class MemoryResponseCache implements ResponseCache {
  readonly entries = new Map<string, Uint8Array>();
  hits = 0;
  misses = 0;

  get(key: string): Promise<Uint8Array | null> {
    const value = this.entries.get(key);
    if (value === undefined) {
      this.misses += 1;
      return Promise.resolve(null);
    }
    this.hits += 1;
    return Promise.resolve(value);
  }

  set(key: string, value: Uint8Array): Promise<void> {
    this.entries.set(key, new Uint8Array(value));
    return Promise.resolve();
  }
}

export interface RecordedLogLine {
  readonly level: LogLevel;
  readonly message: string;
  readonly context: Readonly<Record<string, unknown>>;
}

export class RecordingLogger implements Logger {
  constructor(
    readonly lines: RecordedLogLine[] = [],
    private readonly context: Readonly<Record<string, unknown>> = {},
  ) {}

  log(level: LogLevel, message: string, context: Readonly<Record<string, unknown>> = {}): void {
    this.lines.push({ level, message, context: { ...this.context, ...context } });
  }

  child(context: Readonly<Record<string, unknown>>): Logger {
    return new RecordingLogger(this.lines, { ...this.context, ...context });
  }

  messages(level?: LogLevel): readonly string[] {
    return this.lines
      .filter((line) => level === undefined || line.level === level)
      .map((line) => line.message);
  }
}

function normalize(path: string): string {
  return path.replace(/^\.\//, '').replace(/^\/+/, '');
}
