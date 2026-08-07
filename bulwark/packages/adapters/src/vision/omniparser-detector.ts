import { boxFromTuple } from '@bulwark/domain';
import type {
  DetectionRequest,
  DetectionResult,
  DetectedRegion,
  ElementDetector,
} from '@bulwark/ports';
import { ServiceError } from '@bulwark/ports';
import { HttpJsonClient } from './http-json.js';
import type { HttpJsonClientOptions } from './http-json.js';
import { detectionResponseSchema, healthResponseSchema } from './contract.js';

export interface OmniParserDetectorOptions extends Omit<
  HttpJsonClientOptions,
  'service' | 'timeoutMs' | 'maxAttempts' | 'retryDelayMs'
> {
  readonly timeoutMs?: number;
  readonly maxAttempts?: number;
  readonly retryDelayMs?: number;
}

/**
 * Element detection through the OmniParser HTTP service.
 *
 * The service is expected to return absolute pixel boxes measured on the image it
 * was sent. The adapter verifies the dimensions it reports back, because a service
 * that silently resized the input would return boxes in a different coordinate space
 * and every element would look shifted.
 */
export class OmniParserDetector implements ElementDetector {
  readonly name = 'omniparser';
  private readonly client: HttpJsonClient;

  constructor(options: OmniParserDetectorOptions) {
    this.client = new HttpJsonClient({
      service: 'omniparser',
      baseUrl: options.baseUrl,
      timeoutMs: options.timeoutMs ?? 120_000,
      maxAttempts: options.maxAttempts ?? 3,
      retryDelayMs: options.retryDelayMs ?? 500,
      ...(options.fetchImpl === undefined ? {} : { fetchImpl: options.fetchImpl }),
      ...(options.sleep === undefined ? {} : { sleep: options.sleep }),
    });
  }

  async detect(request: DetectionRequest): Promise<DetectionResult> {
    const payload = await this.client.postJson(
      '/v1/detect',
      {
        image_base64: Buffer.from(request.image).toString('base64'),
        surface: request.surface,
        ...(request.minConfidence === undefined ? {} : { min_confidence: request.minConfidence }),
        ...(request.maxOverlap === undefined ? {} : { max_overlap: request.maxOverlap }),
      },
      detectionResponseSchema,
    );

    const regions: DetectedRegion[] = payload.elements.map((element) => {
      const box = boxFromTuple(element.box);
      if (
        box.xMax > payload.image.width + 1 ||
        box.yMax > payload.image.height + 1 ||
        box.xMin < -1 ||
        box.yMin < -1
      ) {
        throw new ServiceError(
          this.name,
          `element "${element.label}" has a box outside the reported ${payload.image.width}x${payload.image.height} image`,
          { box: element.box },
        );
      }
      return {
        box,
        label: element.label,
        kind: element.kind,
        ...(element.confidence === undefined ? {} : { confidence: element.confidence }),
        ...(element.text === undefined ? {} : { text: element.text }),
        ...(element.interactive === undefined ? {} : { interactive: element.interactive }),
      };
    });

    return {
      regions,
      imageWidth: payload.image.width,
      imageHeight: payload.image.height,
      model: payload.model,
    };
  }

  /** Verifies the service is reachable and reports which model it loaded. */
  async health(): Promise<{ model: string; weightsLoaded: boolean }> {
    const payload = await this.client.getJson('/health', healthResponseSchema);
    return { model: payload.model, weightsLoaded: payload.weights_loaded ?? true };
  }
}
