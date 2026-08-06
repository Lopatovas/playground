import type { BoundingBox } from '@bulwark/domain';

/** A text run with a box wrapped tightly around the drawn characters. */
export interface RecognizedText {
  readonly box: BoundingBox;
  readonly text: string;
  readonly confidence?: number;
}

export interface TextRecognitionRequest {
  /** PNG bytes, normally a crop of one text element rather than a full page. */
  readonly image: Uint8Array;
  readonly minConfidence?: number;
}

export interface TextRecognitionResult {
  readonly runs: readonly RecognizedText[];
  readonly model: string;
}

/**
 * Reads text and returns boxes that hug the glyphs.
 *
 * PaddleOCR fills this role. The tight box is the point: a detector's text box
 * includes line-height and block padding, and dividing that by a cap-height ratio
 * would overstate the font size.
 */
export interface TextRecognizer {
  readonly name: string;
  recognize(request: TextRecognitionRequest): Promise<TextRecognitionResult>;
}
