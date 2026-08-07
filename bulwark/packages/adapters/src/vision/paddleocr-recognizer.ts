import { boxFromTuple } from '@bulwark/domain';
import type {
  RecognizedText,
  TextRecognitionRequest,
  TextRecognitionResult,
  TextRecognizer,
} from '@bulwark/ports';
import { HttpJsonClient } from './http-json.js';
import type { HttpJsonClientOptions } from './http-json.js';
import { healthResponseSchema, recognitionResponseSchema } from './contract.js';

export interface PaddleOcrRecognizerOptions extends Omit<
  HttpJsonClientOptions,
  'service' | 'timeoutMs' | 'maxAttempts' | 'retryDelayMs'
> {
  readonly timeoutMs?: number;
  readonly maxAttempts?: number;
  readonly retryDelayMs?: number;
}

/** Text recognition through the PaddleOCR HTTP service. */
export class PaddleOcrRecognizer implements TextRecognizer {
  readonly name = 'paddleocr';
  private readonly client: HttpJsonClient;

  constructor(options: PaddleOcrRecognizerOptions) {
    this.client = new HttpJsonClient({
      service: 'paddleocr',
      baseUrl: options.baseUrl,
      timeoutMs: options.timeoutMs ?? 60_000,
      maxAttempts: options.maxAttempts ?? 3,
      retryDelayMs: options.retryDelayMs ?? 500,
      ...(options.fetchImpl === undefined ? {} : { fetchImpl: options.fetchImpl }),
      ...(options.sleep === undefined ? {} : { sleep: options.sleep }),
    });
  }

  async recognize(request: TextRecognitionRequest): Promise<TextRecognitionResult> {
    const payload = await this.client.postJson(
      '/v1/recognize',
      {
        image_base64: Buffer.from(request.image).toString('base64'),
        ...(request.minConfidence === undefined ? {} : { min_confidence: request.minConfidence }),
      },
      recognitionResponseSchema,
    );

    const runs: RecognizedText[] = payload.runs.map((run) => ({
      box: boxFromTuple(run.box),
      text: run.text,
      ...(run.confidence === undefined ? {} : { confidence: run.confidence }),
    }));

    return { runs, model: payload.model };
  }

  async health(): Promise<{ model: string; weightsLoaded: boolean }> {
    const payload = await this.client.getJson('/health', healthResponseSchema);
    return { model: payload.model, weightsLoaded: payload.weights_loaded ?? true };
  }
}
