import type { OmniParserDetectorOptions } from './omniparser-detector.js';
import { OmniParserDetector } from './omniparser-detector.js';

export type ScreenParserDetectorOptions = Omit<OmniParserDetectorOptions, 'name'>;

/** ScreenParser speaks the same `/v1/detect` contract; this only sets the service name. */
export class ScreenParserDetector extends OmniParserDetector {
  constructor(options: ScreenParserDetectorOptions) {
    super({ ...options, name: 'screenparser' });
  }
}
