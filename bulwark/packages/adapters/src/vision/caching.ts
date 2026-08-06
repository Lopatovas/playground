import { createHash } from 'node:crypto';
import type {
  DetectionRequest,
  DetectionResult,
  ElementDetector,
  ResponseCache,
  TextRecognitionRequest,
  TextRecognitionResult,
  TextRecognizer,
} from '@bulwark/ports';

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Caches detection results keyed by the image bytes and request parameters.
 *
 * This is what makes a run replayable: with a populated cache, re-analysing the same
 * screenshots produces the same boxes without the services running at all, so a
 * report can be regenerated offline and a change in the analysis math can be
 * attributed to the math rather than to model drift.
 */
export class CachingElementDetector implements ElementDetector {
  constructor(
    private readonly inner: ElementDetector,
    private readonly cache: ResponseCache,
  ) {}

  get name(): string {
    return this.inner.name;
  }

  async detect(request: DetectionRequest): Promise<DetectionResult> {
    const key = detectionCacheKey(this.inner.name, request);
    const cached = await this.cache.get(key);
    if (cached !== null) {
      return JSON.parse(Buffer.from(cached).toString('utf8')) as DetectionResult;
    }

    const result = await this.inner.detect(request);
    await this.cache.set(key, Buffer.from(JSON.stringify(result), 'utf8'));
    return result;
  }
}

export class CachingTextRecognizer implements TextRecognizer {
  constructor(
    private readonly inner: TextRecognizer,
    private readonly cache: ResponseCache,
  ) {}

  get name(): string {
    return this.inner.name;
  }

  async recognize(request: TextRecognitionRequest): Promise<TextRecognitionResult> {
    const key = recognitionCacheKey(this.inner.name, request);
    const cached = await this.cache.get(key);
    if (cached !== null) {
      return JSON.parse(Buffer.from(cached).toString('utf8')) as TextRecognitionResult;
    }

    const result = await this.inner.recognize(request);
    await this.cache.set(key, Buffer.from(JSON.stringify(result), 'utf8'));
    return result;
  }
}

export function detectionCacheKey(service: string, request: DetectionRequest): string {
  return [
    'detect',
    service,
    request.surface,
    sha256(request.image),
    request.minConfidence ?? 'default',
    request.maxOverlap ?? 'default',
  ].join('/');
}

export function recognitionCacheKey(service: string, request: TextRecognitionRequest): string {
  return ['recognize', service, sha256(request.image), request.minConfidence ?? 'default'].join('/');
}
