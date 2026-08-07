import { describe, expect, it, vi } from 'vitest';
import { ContractViolationError, ServiceError } from '@bulwark/ports';
import { createBox, createRgb } from '@bulwark/domain';
import { createRaster, encodePng, fillRect } from '@bulwark/imaging';
import { OmniParserDetector } from './omniparser-detector.js';
import { PaddleOcrRecognizer } from './paddleocr-recognizer.js';
import { InkProjectionRecognizer } from './ink-projection-recognizer.js';
import {
  CachingElementDetector,
  CachingTextRecognizer,
  detectionCacheKey,
  sha256,
} from './caching.js';
import { FakeElementDetector, FakeTextRecognizer, MemoryResponseCache } from '../testing/fakes.js';

const IMAGE = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function detectorFor(fetchImpl: ReturnType<typeof vi.fn>): OmniParserDetector {
  return new OmniParserDetector({
    baseUrl: 'http://omniparser:8000',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    sleep: () => Promise.resolve(),
    maxAttempts: 1,
  });
}

describe('OmniParserDetector', () => {
  it('sends the image as base64 and maps the response into domain boxes', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model: 'omniparser-v2',
        image: { width: 1440, height: 900 },
        elements: [
          {
            box: [40, 40, 400, 100],
            label: 'heading',
            kind: 'text',
            confidence: 0.92,
            text: 'Ship faster',
          },
          { box: [360, 56, 384, 80], label: 'search icon', kind: 'icon' },
        ],
      }),
    );

    const result = await detectorFor(fetchImpl).detect({ surface: 'design', image: IMAGE });

    expect(result.model).toBe('omniparser-v2');
    expect(result.imageWidth).toBe(1440);
    expect(result.regions).toHaveLength(2);
    expect(result.regions[0]).toEqual({
      box: { xMin: 40, yMin: 40, xMax: 400, yMax: 100 },
      label: 'heading',
      kind: 'text',
      confidence: 0.92,
      text: 'Ship faster',
    });

    const body = JSON.parse((fetchImpl.mock.calls[0]?.[1] as RequestInit).body as string) as Record<
      string,
      unknown
    >;
    expect(body['image_base64']).toBe(Buffer.from(IMAGE).toString('base64'));
    expect(body['surface']).toBe('design');
  });

  it('forwards optional thresholds only when set', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ model: 'm', image: { width: 10, height: 10 }, elements: [] }),
      );
    await detectorFor(fetchImpl).detect({ surface: 'live', image: IMAGE, minConfidence: 0.3 });

    const body = JSON.parse((fetchImpl.mock.calls[0]?.[1] as RequestInit).body as string) as Record<
      string,
      unknown
    >;
    expect(body['min_confidence']).toBe(0.3);
    expect(body).not.toHaveProperty('max_overlap');
  });

  it('defaults an unlabelled kind to unknown rather than failing', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model: 'm',
        image: { width: 100, height: 100 },
        elements: [{ box: [0, 0, 10, 10], label: 'thing' }],
      }),
    );

    const result = await detectorFor(fetchImpl).detect({ surface: 'design', image: IMAGE });
    expect(result.regions[0]?.kind).toBe('unknown');
  });

  it('rejects a payload that omits required fields', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ model: 'm', image: { width: 10, height: 10 }, elements: [{ label: 'x' }] }),
      );

    await expect(
      detectorFor(fetchImpl).detect({ surface: 'design', image: IMAGE }),
    ).rejects.toThrow(ContractViolationError);
  });

  it('rejects boxes that fall outside the image the service reported', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model: 'm',
        image: { width: 100, height: 100 },
        elements: [{ box: [0, 0, 260, 40], label: 'wide', kind: 'text' }],
      }),
    );

    await expect(
      detectorFor(fetchImpl).detect({ surface: 'design', image: IMAGE }),
    ).rejects.toThrow(/outside the reported 100x100 image/);
  });

  it('reports service health including fallback mode', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 'ok', model: 'heuristic', weights_loaded: false }));

    await expect(detectorFor(fetchImpl).health()).resolves.toEqual({
      model: 'heuristic',
      weightsLoaded: false,
    });
  });
});

describe('PaddleOcrRecognizer', () => {
  it('maps runs into tight domain boxes', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model: 'paddleocr-v4',
        runs: [{ box: [10, 12, 90, 30], text: 'Get Started', confidence: 0.98 }],
      }),
    );

    const recognizer = new PaddleOcrRecognizer({
      baseUrl: 'http://paddleocr:8001',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: () => Promise.resolve(),
      maxAttempts: 1,
    });

    const result = await recognizer.recognize({ image: IMAGE, minConfidence: 0.5 });
    expect(result.model).toBe('paddleocr-v4');
    expect(result.runs[0]).toEqual({
      box: { xMin: 10, yMin: 12, xMax: 90, yMax: 30 },
      text: 'Get Started',
      confidence: 0.98,
    });
  });

  it('surfaces a service outage as a ServiceError', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: 'oom' }, 500));
    const recognizer = new PaddleOcrRecognizer({
      baseUrl: 'http://paddleocr:8001',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: () => Promise.resolve(),
      maxAttempts: 1,
    });

    await expect(recognizer.recognize({ image: IMAGE })).rejects.toThrow(ServiceError);
  });
});

describe('InkProjectionRecognizer', () => {
  it('returns a box hugging the ink, without needing a model', async () => {
    const raster = createRaster(60, 40, createRgb(255, 255, 255));
    fillRect(raster, createBox(10, 12, 40, 28), createRgb(17, 24, 39));

    const result = await new InkProjectionRecognizer().recognize({ image: encodePng(raster) });

    expect(result.model).toBe('ink-projection');
    expect(result.runs).toHaveLength(1);
    expect(result.runs[0]?.box).toEqual({ xMin: 10, yMin: 12, xMax: 40, yMax: 28 });
    expect(result.runs[0]?.text).toBe('');
  });

  it('returns one run per line of text', async () => {
    const raster = createRaster(60, 60, createRgb(255, 255, 255));
    fillRect(raster, createBox(10, 6, 40, 18), createRgb(17, 24, 39));
    fillRect(raster, createBox(10, 34, 40, 46), createRgb(17, 24, 39));

    const result = await new InkProjectionRecognizer().recognize({ image: encodePng(raster) });
    expect(result.runs.map((run) => run.box.yMin)).toEqual([6, 34]);
  });

  it('returns nothing for a blank crop instead of inventing a box', async () => {
    const raster = createRaster(20, 20, createRgb(255, 255, 255));
    const result = await new InkProjectionRecognizer().recognize({ image: encodePng(raster) });
    expect(result.runs).toEqual([]);
  });
});

describe('caching decorators', () => {
  const detectionResult = {
    regions: [],
    imageWidth: 10,
    imageHeight: 10,
    model: 'fake',
  };

  it('calls the service once for repeated identical requests', async () => {
    const inner = FakeElementDetector.bySurface(detectionResult, detectionResult);
    const cache = new MemoryResponseCache();
    const detector = new CachingElementDetector(inner, cache);

    await detector.detect({ surface: 'design', image: IMAGE });
    await detector.detect({ surface: 'design', image: IMAGE });

    expect(inner.requests).toHaveLength(1);
    expect(cache.hits).toBe(1);
    expect(cache.misses).toBe(1);
  });

  it('treats a different image as a different request', async () => {
    const inner = FakeElementDetector.bySurface(detectionResult, detectionResult);
    const detector = new CachingElementDetector(inner, new MemoryResponseCache());

    await detector.detect({ surface: 'design', image: IMAGE });
    await detector.detect({ surface: 'design', image: new Uint8Array([9, 9, 9]) });

    expect(inner.requests).toHaveLength(2);
  });

  it('replays a cached response byte-for-byte', async () => {
    const populated = {
      regions: [{ box: createBox(1, 2, 3, 4), label: 'x', kind: 'text' as const }],
      imageWidth: 10,
      imageHeight: 10,
      model: 'fake',
    };
    const cache = new MemoryResponseCache();
    const first = await new CachingElementDetector(
      FakeElementDetector.bySurface(populated, populated),
      cache,
    ).detect({ surface: 'design', image: IMAGE });

    // A detector that would throw proves the second read came from the cache.
    const second = await new CachingElementDetector(
      new FakeElementDetector(new Map()),
      cache,
    ).detect({ surface: 'design', image: IMAGE });

    expect(second).toEqual(first);
  });

  it('keys on the request parameters as well as the bytes', () => {
    const base = { surface: 'design' as const, image: IMAGE };
    expect(detectionCacheKey('omniparser', base)).not.toBe(
      detectionCacheKey('omniparser', { ...base, minConfidence: 0.5 }),
    );
    expect(detectionCacheKey('omniparser', base)).toContain(sha256(IMAGE));
  });

  it('caches recognition results too', async () => {
    const inner = new FakeTextRecognizer({ runs: [], model: 'fake' });
    const recognizer = new CachingTextRecognizer(inner, new MemoryResponseCache());

    await recognizer.recognize({ image: IMAGE });
    await recognizer.recognize({ image: IMAGE });

    expect(inner.requests).toHaveLength(1);
    expect(recognizer.name).toBe('fake-recognizer');
  });
});
