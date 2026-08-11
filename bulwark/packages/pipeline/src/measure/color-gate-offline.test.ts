/**
 * Offline color-gate replay against cached SP runs under /tmp/color-gate-cache.
 *
 *   pnpm --filter @bulwark/pipeline exec vitest run src/measure/color-gate-offline.test.ts
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ColorDefect, DetectedElement, ElementKind, QaReport } from '@bulwark/domain';
import { checkColors, matchElements } from '@bulwark/domain';
import { decodePng } from '@bulwark/imaging';
import type { DetectionResult } from '@bulwark/ports';
import { ColorMeasurer } from './color-measurer.js';
import { mergeSolidFillProposals } from '../surface/merge-solid-regions.js';

const CACHE_ROOT = process.env.COLOR_GATE_CACHE ?? '/tmp/color-gate-cache';
const MANIFEST_ROOT =
  process.env.COLOR_GATE_MANIFESTS ??
  join(process.cwd(), '../../demo/fixtures');

const HEX_PAIR = /#([0-9a-fA-F]{3,8})\s+instead of\s+#([0-9a-fA-F]{3,8})/;

function normHex(h: string): string {
  let hex = h.trim().replace(/^#/, '').toLowerCase();
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  return `#${hex.slice(0, 6)}`;
}

function seedCount(fixture: string): number {
  const path = join(MANIFEST_ROOT, fixture, 'manifest.json');
  if (!existsSync(path)) return 0;
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as {
    seeds: { expectedDefectTypes: string[] }[];
  };
  return manifest.seeds.filter((s) => s.expectedDefectTypes.includes('color')).length;
}

function loadColorSeeds(fixture: string): {
  id: string;
  actual: string;
  expected: string;
  roleHint: 'foreground' | 'background' | null;
}[] {
  const path = join(MANIFEST_ROOT, fixture, 'manifest.json');
  if (!existsSync(path)) return [];
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as {
    seeds: { id: string; description: string; expectedDefectTypes: string[] }[];
  };
  return manifest.seeds
    .filter((s) => s.expectedDefectTypes.includes('color'))
    .flatMap((s) => {
      const m = HEX_PAIR.exec(s.description);
      if (!m) return [];
      const blob = `${s.id} ${s.description}`.toLowerCase();
      const roleHint: 'foreground' | 'background' | null =
        /ink|link|headline|title|accent|star|mail|nav|price|free|up|alert/.test(blob)
          ? 'foreground'
          : /fill|badge|chip|tag|cta|button|swatch|kpi|day|pill|color/.test(blob)
            ? 'background'
            : null;
      return [
        {
          id: s.id,
          actual: normHex(m[1]!),
          expected: normHex(m[2]!),
          roleHint,
        },
      ];
    });
}

/** Allow small channel drift between CSS seed literals and raster-measured hex. */
function hexClose(a: string, b: string, maxChannel = 18): boolean {
  const pa = a.slice(1);
  const pb = b.slice(1);
  for (let i = 0; i < 3; i += 1) {
    const da = Number.parseInt(pa.slice(i * 2, i * 2 + 2), 16);
    const db = Number.parseInt(pb.slice(i * 2, i * 2 + 2), 16);
    if (Math.abs(da - db) > maxChannel) return false;
  }
  return true;
}

function loadFixture(id: string) {
  const dir = join(CACHE_ROOT, id);
  const report = JSON.parse(readFileSync(join(dir, 'report.json'), 'utf8')) as QaReport;
  const designPng = readFileSync(join(dir, report.surfaces.design.imagePath));
  const livePng = readFileSync(join(dir, report.surfaces.live.imagePath));
  return { report, designRaster: decodePng(designPng), liveRaster: decodePng(livePng) };
}

function surfaceMap(elements: readonly DetectedElement[]) {
  return new Map(
    elements.map((element) => [
      element.id,
      {
        element,
        sourceBox: element.box,
      },
    ]),
  );
}

function detectionFromElements(
  elements: readonly DetectedElement[],
  width: number,
  height: number,
): DetectionResult {
  return {
    regions: elements.map((element) => ({
      box: element.box,
      label: element.label,
      kind: element.kind,
      ...(element.confidence === undefined ? {} : { confidence: element.confidence }),
    })),
    imageWidth: width,
    imageHeight: height,
    model: 'cache+solid',
  };
}

function elementsFromDetection(
  detection: DetectionResult,
  surface: 'design' | 'live',
): DetectedElement[] {
  return detection.regions.map((region, index) => ({
    id: `${surface}-${String(index + 1).padStart(3, '0')}`,
    surface,
    box: region.box,
    kind: region.kind as ElementKind,
    label: region.label,
    ...(region.confidence === undefined ? {} : { confidence: region.confidence }),
  }));
}

function replayColor(id: string, inkDeltaE: number) {
  const { report, designRaster, liveRaster } = loadFixture(id);

  const designMerged = mergeSolidFillProposals(
    detectionFromElements(
      report.measurements.designElements,
      designRaster.width,
      designRaster.height,
    ),
    designRaster,
    { enabled: true },
  );
  const liveMerged = mergeSolidFillProposals(
    detectionFromElements(report.measurements.liveElements, liveRaster.width, liveRaster.height),
    liveRaster,
    { enabled: true },
  );

  const designElements = elementsFromDetection(designMerged, 'design');
  const liveElements = elementsFromDetection(liveMerged, 'live');
  const match = matchElements(designElements, liveElements, {
    maxCenterDistance: 48,
    minIou: 0.05,
    requireSameKind: false,
    labelMismatchPenalty: 0.15,
    centerDistanceWeight: 1,
    iouWeight: 1,
  });

  const designById = surfaceMap(designElements);
  const liveById = surfaceMap(liveElements);

  const measurer = new ColorMeasurer(
    {
      logger: {
        log() {
          /* silent */
        },
      },
    },
    {
      clusterCount: 4,
      minForegroundShare: 0.01,
      minForegroundDeltaE: 5,
      pageBackground: '#ffffff',
      edgeInsetPx: 1,
      liveSource: 'raster',
      mode: 'specialized',
      strategy: {
        minSolidShare: 0.45,
        minSolidImageShare: 0.72,
        minPaletteShare: 0.18,
        solidTextMinChroma: 20,
      },
      minInkPixels: 8,
      maxInkBackgroundDeltaE: 18,
      maxInkShareMismatch: 0.55,
      inkAccentChroma: 20,
      maxAccentInkShareMismatch: 0.75,
    },
  );

  const measured = measurer.measure(
    match.pairs,
    designRaster,
    liveRaster,
    designById,
    liveById,
    [],
  );
  const checked = checkColors(measured.measurements, {
    deltaEThreshold: report.tolerances.deltaE,
    inkDeltaEThreshold: inkDeltaE,
    inkNeutralDeltaEThreshold: Math.max(inkDeltaE + 5, 13),
    inkAccentChroma: 20,
    seriesDeltaEThreshold: 8,
    weights: { lightness: 1, chroma: 1, hue: 1 },
    checkForeground: true,
  });

  const solidPairs = match.pairs.filter(
    (pair) =>
      pair.designElement.label === 'SolidFill' || pair.liveElement.label === 'SolidFill',
  ).length;

  return {
    comparisons: checked.comparisons.length,
    defects: checked.defects,
    fillN: checked.defects.filter((d) => d.role === 'background').length,
    inkN: checked.defects.filter((d) => d.role === 'foreground').length,
    solidPairs,
    strategies: measured.measurements.map((m) => `${m.label}:${m.strategy ?? '?'}`),
  };
}

function scoreFixture(fixture: string, defects: readonly ColorDefect[]) {
  const seeds = loadColorSeeds(fixture);
  const used = new Set<number>();
  const hits: string[] = [];
  const misses: { id: string; roleHint: string | null }[] = [];

  for (const seed of seeds) {
    const matchIdx = defects.findIndex((d, i) => {
      if (used.has(i)) return false;
      if (seed.roleHint && d.role !== seed.roleHint) return false;
      return (
        hexClose(normHex(d.expectedHex), seed.expected) &&
        hexClose(normHex(d.actualHex), seed.actual)
      );
    });
    if (matchIdx >= 0) {
      used.add(matchIdx);
      hits.push(seed.id);
    } else {
      misses.push({ id: seed.id, roleHint: seed.roleHint });
    }
  }

  const tp = used.size;
  const fp = defects.length - tp;
  return {
    seeds: seeds.length,
    seedsHit: hits.length,
    defects: defects.length,
    tpDefects: tp,
    fpDefects: fp,
    hits,
    misses,
    falsePositives: defects
      .filter((_, i) => !used.has(i))
      .map((d) => ({
        role: d.role,
        expected: d.expectedHex,
        actual: d.actualHex,
        msg: d.message.slice(0, 100),
      })),
  };
}

describe('color gate offline replay', () => {
  it('has cached SP runs for the suite', () => {
    expect(existsSync(CACHE_ROOT)).toBe(true);
    const fixtures = readdirSync(CACHE_ROOT).filter((name) =>
      existsSync(join(CACHE_ROOT, name, 'report.json')),
    );
    expect(fixtures.length).toBeGreaterThanOrEqual(5);
  });

  it(
    'A/B ink ΔE 10 vs 14 with solid-image fills',
    () => {
      const fixtures = readdirSync(CACHE_ROOT)
        .filter((name) => existsSync(join(CACHE_ROOT, name, 'report.json')))
        .sort();

      console.log(
        `${'fixture'.padEnd(16)} ${'seeds'.padStart(5)} ${'dE10'.padStart(5)} ${'dE14'.padStart(5)} ${'fill10'.padStart(6)} ${'ink10'.padStart(5)}`,
      );

      let seeds = 0;
      let c10 = 0;
      let c14 = 0;

      for (const fixture of fixtures) {
        const nSeed = seedCount(fixture);
        const a = replayColor(fixture, 10);
        const b = replayColor(fixture, 14);
        seeds += nSeed;
        c10 += a.defects.length;
        c14 += b.defects.length;
        console.log(
          `${fixture.padEnd(16)} ${String(nSeed).padStart(5)} ${String(a.defects.length).padStart(5)} ${String(b.defects.length).padStart(5)} ${String(a.fillN).padStart(6)} ${String(a.inkN).padStart(5)}`,
        );
        if (a.defects.length !== b.defects.length) {
          for (const d of a.defects) {
            if (!b.defects.some((x) => x.id === d.id)) {
              console.log(`  dropped@14 [${d.role}] ${d.message.slice(0, 90)}`);
            }
          }
        }
      }

      console.log(
        `SUITE seeds=${seeds} color@10=${c10} (ratio ${((100 * seeds) / Math.max(c10, 1)).toFixed(1)}%) ` +
          `color@14=${c14} (ratio ${((100 * seeds) / Math.max(c14, 1)).toFixed(1)}%)`,
      );

      // Sanity: classic button fixtures should still fire at least one fill defect.
      for (const id of ['landing', 'workspace', 'admin', 'settings']) {
        if (!fixtures.includes(id)) continue;
        expect(replayColor(id, 10).fillN).toBeGreaterThanOrEqual(1);
      }
    },
    60_000,
  );

  it(
    'seed-matched recall/precision with border-BG ink sampler',
    () => {
      const fixtures = readdirSync(CACHE_ROOT)
        .filter((name) => existsSync(join(CACHE_ROOT, name, 'report.json')))
        .sort();

      const fixturesOut: Record<
        string,
        ReturnType<typeof scoreFixture> & { recall: number; precision: number }
      > = {};
      let seeds = 0;
      let seedsHit = 0;
      let defects = 0;
      let tpDefects = 0;

      console.log(
        `${'fixture'.padEnd(16)} ${'hit'.padStart(7)} ${'recall'.padStart(7)} ${'prec'.padStart(7)} ${'inkN'.padStart(5)} ${'misses'}`,
      );

      for (const fixture of fixtures) {
        const replay = replayColor(fixture, 8);
        const scored = scoreFixture(fixture, replay.defects);
        const recall = scored.seeds === 0 ? 100 : (100 * scored.seedsHit) / scored.seeds;
        const precision = scored.defects === 0 ? 100 : (100 * scored.tpDefects) / scored.defects;
        fixturesOut[fixture] = { ...scored, recall, precision };
        seeds += scored.seeds;
        seedsHit += scored.seedsHit;
        defects += scored.defects;
        tpDefects += scored.tpDefects;
        console.log(
          `${fixture.padEnd(16)} ${`${scored.seedsHit}/${scored.seeds}`.padStart(7)} ${recall.toFixed(0).padStart(6)}% ${precision.toFixed(0).padStart(6)}% ${String(replay.inkN).padStart(5)} solidPairs=${replay.solidPairs} ${scored.misses.map((m) => m.id).join(',') || '-'}`,
        );
      }

      const fpDefects = defects - tpDefects;
      const suiteRecall = (100 * seedsHit) / Math.max(seeds, 1);
      const suitePrecision = (100 * tpDefects) / Math.max(defects, 1);
      const f1 =
        suiteRecall + suitePrecision === 0
          ? 0
          : (2 * suiteRecall * suitePrecision) / (suiteRecall + suitePrecision);

      const summary = {
        totals: { seeds, seedsHit, defects, tpDefects, fpDefects },
        suiteRecall,
        suitePrecision,
        f1,
        fixtures: fixturesOut,
      };
      writeFileSync('/tmp/color-seed-score-solids.json', JSON.stringify(summary, null, 2));

      console.log(
        `SEED-MATCHED seedsHit=${seedsHit}/${seeds} (${suiteRecall.toFixed(1)}%) ` +
          `precision=${tpDefects}/${defects} (${suitePrecision.toFixed(1)}%) F1=${f1.toFixed(1)}% ` +
          `fp=${fpDefects}`,
      );
      console.log(
        '(prior: ink-tune 35/50 70%r / 78%p; Otsu 58%r)',
      );

      console.log('\nink ΔE sweep (seed-matched):');
      for (const inkDeltaE of [6, 8, 10]) {
        let hit = 0;
        let seedN = 0;
        let defN = 0;
        let tp = 0;
        for (const fixture of fixtures) {
          const replay = replayColor(fixture, inkDeltaE);
          const scored = scoreFixture(fixture, replay.defects);
          hit += scored.seedsHit;
          seedN += scored.seeds;
          defN += scored.defects;
          tp += scored.tpDefects;
        }
        const r = (100 * hit) / Math.max(seedN, 1);
        const p = (100 * tp) / Math.max(defN, 1);
        const f = r + p === 0 ? 0 : (2 * r * p) / (r + p);
        console.log(
          `  inkΔE=${inkDeltaE}: recall ${hit}/${seedN} (${r.toFixed(1)}%) ` +
            `prec ${tp}/${defN} (${p.toFixed(1)}%) F1=${f.toFixed(1)}% fp=${defN - tp}`,
        );
      }

      expect(seeds).toBeGreaterThanOrEqual(40);
    },
    180_000,
  );
});
