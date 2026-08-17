import type { BoundingBox, ElementKind, SurfaceId } from '@bulwark/domain';

/** One element as the detection service reports it, before normalisation. */
export interface DetectedRegion {
  readonly box: BoundingBox;
  /** Semantic label, e.g. "search icon". */
  readonly label: string;
  readonly kind: ElementKind;
  readonly confidence?: number;
  /** Text the detector read inside the region, when it reads text at all. */
  readonly text?: string;
  /** Whether the detector considers this an interactive control. */
  readonly interactive?: boolean;
}

export interface DetectionRequest {
  readonly surface: SurfaceId;
  /** PNG bytes of the full surface. */
  readonly image: Uint8Array;
  /** Detector confidence floor, forwarded to the service. */
  readonly minConfidence?: number;
  /** Overlap ceiling for the detector's own suppression pass. */
  readonly maxOverlap?: number;
}

export interface DetectionResult {
  readonly regions: readonly DetectedRegion[];
  /** Size the detector measured the image at, used to catch scaling mistakes. */
  readonly imageWidth: number;
  readonly imageHeight: number;
  /** Free-form identifier of the model behind the service, recorded in reports. */
  readonly model: string;
}

/**
 * Locates the elements on a surface.
 *
 * OmniParser fills this role in production. It stays behind an interface because the
 * pipeline's correctness must be testable without a GPU, a model download or a
 * network, and because a project that already has a layout tree may prefer to feed
 * that in instead.
 */
export interface ElementDetector {
  readonly name: string;
  detect(request: DetectionRequest): Promise<DetectionResult>;
}
