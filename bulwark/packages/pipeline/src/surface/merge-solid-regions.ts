import type { DetectionResult, DetectedRegion } from '@bulwark/ports';
import type { Raster } from '@bulwark/imaging';
import {
  filterSolidFillsAgainstExisting,
  proposeSolidFillRegions,
  type MergeSolidFillOptions,
} from '@bulwark/imaging';

/**
 * Appends flat color regions ScreenParser missed (KPI tiles, swatches, chips).
 *
 * Proposals are labeled `SolidFill` / `image` so the specialized color path can
 * fill-check them. Charts and photos are rejected upstream by purity/solidity.
 */
export function mergeSolidFillProposals(
  detection: DetectionResult,
  raster: Raster,
  options: Partial<MergeSolidFillOptions> & { enabled?: boolean } = {},
): DetectionResult {
  if (options.enabled === false) return detection;

  const proposals = proposeSolidFillRegions(raster, options);
  const kept = filterSolidFillsAgainstExisting(
    proposals,
    detection.regions.map((region) => region.box),
    options,
    raster,
  );
  if (kept.length === 0) return detection;

  const extras: DetectedRegion[] = kept.map((region) => ({
    box: region.box,
    label: 'SolidFill',
    kind: 'image',
    confidence: Math.min(1, region.purity),
    interactive: false,
  }));

  return {
    ...detection,
    regions: [...detection.regions, ...extras],
  };
}
