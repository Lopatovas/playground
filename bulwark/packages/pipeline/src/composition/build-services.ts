import {
  CachingElementDetector,
  CachingTextRecognizer,
  FilesystemResponseCache,
  InkProjectionRecognizer,
  OmniParserDetector,
  PaddleOcrRecognizer,
  PlaywrightLiveInspector,
  PlaywrightTextRasterizer,
  ScreenParserDetector,
} from '@bulwark/adapters';
import type {
  ElementDetector,
  LiveInspector,
  TextRasterizer,
  TextRecognizer,
} from '@bulwark/ports';
import type { BulwarkConfig } from '../config/config.js';

export interface BuiltServices {
  readonly detector: ElementDetector;
  readonly recognizer: TextRecognizer;
  readonly rasterizer?: TextRasterizer;
  readonly inspector: LiveInspector;
}

/**
 * Builds the concrete services a configuration asks for.
 *
 * This is the only place that knows which implementation backs each port, so the
 * engine stays testable and a new detector or OCR backend is one branch here rather
 * than a change threaded through the pipeline.
 */
export function buildServices(config: BulwarkConfig): BuiltServices {
  const cache =
    config.services.cacheDir === undefined
      ? undefined
      : new FilesystemResponseCache(config.services.cacheDir);

  const detectorOptions = {
    baseUrl: config.services.detector.baseUrl,
    timeoutMs: config.services.detector.timeoutMs,
  };
  const detector = withDetectorCache(
    config.services.detector.kind === 'screenparser'
      ? new ScreenParserDetector(detectorOptions)
      : new OmniParserDetector(detectorOptions),
    cache,
  );

  const recognizer = withRecognizerCache(
    config.services.recognizer.kind === 'paddleocr'
      ? new PaddleOcrRecognizer({
          baseUrl: config.services.recognizer.baseUrl,
          timeoutMs: config.services.recognizer.timeoutMs,
        })
      : new InkProjectionRecognizer(),
    cache,
  );

  const rasterizer =
    config.services.rasterizer.kind === 'playwright'
      ? new PlaywrightTextRasterizer({ expectedFamilies: config.typography.candidateFamilies })
      : undefined;

  return {
    detector,
    recognizer,
    ...(rasterizer === undefined ? {} : { rasterizer }),
    inspector: new PlaywrightLiveInspector(),
  };
}

function withDetectorCache(
  detector: ElementDetector,
  cache: FilesystemResponseCache | undefined,
): ElementDetector {
  return cache === undefined ? detector : new CachingElementDetector(detector, cache);
}

function withRecognizerCache(
  recognizer: TextRecognizer,
  cache: FilesystemResponseCache | undefined,
): TextRecognizer {
  // The local recognizer is pure computation, so caching it would trade one cheap
  // pass over a crop for a filesystem round trip.
  if (cache === undefined || recognizer instanceof InkProjectionRecognizer) return recognizer;
  return new CachingTextRecognizer(recognizer, cache);
}
