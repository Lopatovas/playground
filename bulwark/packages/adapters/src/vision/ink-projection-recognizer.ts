import type { TextRecognitionRequest, TextRecognitionResult, TextRecognizer } from '@bulwark/ports';
import {
  DEFAULT_TEXT_INK_OPTIONS,
  buildInkMask,
  decodePng,
  measureTextInk,
  toGrayscale,
} from '@bulwark/imaging';
import type { TextInkOptions } from '@bulwark/imaging';

export interface InkProjectionRecognizerOptions {
  readonly textInk: TextInkOptions;
}

/**
 * Text-box recognition without an OCR model, by ink projection alone.
 *
 * The typography checks need one thing from OCR: a box wrapped tightly around the
 * drawn glyphs. Otsu thresholding plus row/column projection produces exactly that,
 * with no weights to download and no parameters to tune, which makes it a viable
 * default and a useful cross-check against PaddleOCR's boxes.
 *
 * It deliberately does not transcribe: `text` comes back empty. That costs nothing
 * here, because the string being rendered is read from the live DOM rather than from
 * the design raster.
 */
export class InkProjectionRecognizer implements TextRecognizer {
  readonly name = 'ink-projection';
  private readonly textInk: TextInkOptions;

  constructor(options: Partial<InkProjectionRecognizerOptions> = {}) {
    this.textInk = options.textInk ?? DEFAULT_TEXT_INK_OPTIONS;
  }

  recognize(request: TextRecognitionRequest): Promise<TextRecognitionResult> {
    const raster = decodePng(request.image);
    const mask = buildInkMask(toGrayscale(raster));
    const measurement = measureTextInk(mask, this.textInk);

    if (measurement === null) {
      return Promise.resolve({ runs: [], model: this.name });
    }

    return Promise.resolve({
      runs: measurement.lines.map((line) => ({ box: line.box, text: '' })),
      model: this.name,
    });
  }
}
