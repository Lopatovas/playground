import { describe, expect, it } from 'vitest';
import { canonicalStringify } from '@bulwark/domain';
import type { Defect, DefectType } from '@bulwark/domain';
import { createHarness, sha256 } from '../testing/harness.js';
import {
  REFERENCE_GAPS,
  REFERENCE_SCENE,
  buildReferenceRenders,
  mutateScene,
  shiftElement,
} from '../testing/fixtures.js';
import type { SceneSpec } from '../testing/fixtures.js';

function elementOf(spec: SceneSpec, id: string) {
  const element = spec.elements.find((candidate) => candidate.id === id);
  if (element === undefined) throw new Error(`Reference scene has no element "${id}"`);
  return element;
}

function defectsOfType<T extends DefectType>(defects: readonly Defect[], type: T) {
  return defects.filter((defect) => defect.type === type);
}

describe('QaEngine on a faithful implementation', () => {
  it('reports no defects', async () => {
    const report = await createHarness({ designSpec: REFERENCE_SCENE }).analyze();

    expect(report.defects).toEqual([]);
    expect(report.summary.passed).toBe(true);
    expect(report.summary.matchedElementCount).toBe(REFERENCE_SCENE.elements.length);
    expect(report.summary.matchRate).toBe(1);
  });

  it('recovers the declared font sizes from the design pixels alone', async () => {
    const report = await createHarness({ designSpec: REFERENCE_SCENE }).analyze();
    const byText = new Map(
      report.measurements.typography.map((finding) => [finding.text, finding] as const),
    );

    expect(byText.get('ShipFaster')).toMatchObject({
      expectedCssFontSizePx: 24,
      actualCssFontSizePx: 24,
      expectedFamily: 'Mark Pro',
      visualToCssRatio: 0.82,
      visualHeightPx: 20,
    });
    expect(byText.get('Deterministic')).toMatchObject({
      expectedCssFontSizePx: 16,
      actualCssFontSizePx: 16,
      expectedFamily: 'Open Sans',
      visualToCssRatio: 0.85,
      visualHeightPx: 14,
    });
  });

  it('measures the declared spacing rhythm', async () => {
    const report = await createHarness({ designSpec: REFERENCE_SCENE }).analyze();
    const vertical = report.measurements.spacing.filter(
      (comparison) => comparison.axis === 'vertical',
    );

    expect(vertical.map((comparison) => comparison.designGapPx)).toEqual([
      REFERENCE_GAPS.headingToBody,
      REFERENCE_GAPS.bodyToCta,
    ]);
    expect(vertical.every((comparison) => comparison.deltaPx === 0)).toBe(true);
  });

  it('reads the design colors out of the clustered crops', async () => {
    const report = await createHarness({ designSpec: REFERENCE_SCENE }).analyze();
    const button = report.measurements.colors.filter(
      (comparison) => comparison.designElementId === 'design-004',
    );

    expect(button.find((comparison) => comparison.role === 'background')).toMatchObject({
      designHex: '#2563eb',
      liveHex: '#2563eb',
      deltaE2000: 0,
    });
    expect(button.find((comparison) => comparison.role === 'foreground')).toBeUndefined();
  });

  it('records the exact bytes it measured', async () => {
    const harness = createHarness({ designSpec: REFERENCE_SCENE });
    const report = await harness.analyze();

    expect(report.surfaces.design.imageSha256).toBe(sha256(harness.designScene.png));
    expect(report.surfaces.live.imageSha256).toBe(sha256(harness.live.screenshot));
    expect(report.surfaces.design).toMatchObject({
      imagePath: 'figma-screenshot.png',
      width: 800,
      height: 600,
    });
  });

  it('produces byte-identical reports across runs', async () => {
    const harness = createHarness({ designSpec: REFERENCE_SCENE });
    const [first, second] = await Promise.all([harness.analyze(), harness.analyze()]);
    expect(canonicalStringify(first)).toBe(canonicalStringify(second));
  });
});

describe('QaEngine layout regressions', () => {
  it('flags a shifted button as one spacing defect and one position defect', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, {
      cta: shiftElement(elementOf(REFERENCE_SCENE, 'cta'), 0, 8),
    });

    const report = await createHarness({ designSpec: REFERENCE_SCENE, liveSpec }).analyze();

    const spacing = defectsOfType(report.defects, 'spacing');
    expect(spacing).toHaveLength(1);
    expect(spacing[0]).toMatchObject({
      axis: 'vertical',
      designGapPx: 24,
      liveGapPx: 32,
      deltaPx: 8,
      tolerancePx: 2,
    });

    const position = defectsOfType(report.defects, 'position');
    expect(position).toHaveLength(1);
    expect(position[0]).toMatchObject({ offsetXPx: 0, offsetYPx: 8 });
    expect(report.summary.passed).toBe(false);
  });

  it('stays silent about a shift inside the tolerance', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, {
      cta: shiftElement(elementOf(REFERENCE_SCENE, 'cta'), 0, 2),
    });

    const report = await createHarness({ designSpec: REFERENCE_SCENE, liveSpec }).analyze();
    expect(report.defects).toEqual([]);
  });

  it('flags an element the implementation never rendered', async () => {
    const liveSpec: SceneSpec = {
      ...REFERENCE_SCENE,
      elements: REFERENCE_SCENE.elements.filter((element) => element.id !== 'cta'),
    };

    const report = await createHarness({ designSpec: REFERENCE_SCENE, liveSpec }).analyze();
    const missing = defectsOfType(report.defects, 'missing-element');

    expect(missing).toHaveLength(1);
    expect(missing[0]).toMatchObject({ severity: 'error', label: 'primary button', kind: 'text' });
    expect(report.summary.matchedElementCount).toBe(3);
  });

  it('flags an element the implementation added', async () => {
    const liveSpec: SceneSpec = {
      ...REFERENCE_SCENE,
      elements: [
        ...REFERENCE_SCENE.elements,
        {
          id: 'banner',
          box: [500, 40, 760, 96],
          kind: 'container',
          label: 'promo banner',
          background: '#fef3c7',
          domId: 'main>aside',
          tagName: 'aside',
        },
      ],
    };

    const report = await createHarness({ designSpec: REFERENCE_SCENE, liveSpec }).analyze();
    const unexpected = defectsOfType(report.defects, 'unexpected-element');

    expect(unexpected).toHaveLength(1);
    expect(unexpected[0]).toMatchObject({ severity: 'warning', label: 'promo banner' });
    // A warning alone must not fail the run.
    expect(report.summary.passed).toBe(true);
  });
});

describe('QaEngine typography regressions', () => {
  it('flags 24px design type rendered at 18px', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, {
      heading: { text: { fontSizePx: 18 } as never },
    });

    const report = await createHarness({ designSpec: REFERENCE_SCENE, liveSpec }).analyze();
    const sizes = defectsOfType(report.defects, 'font-size');

    expect(sizes).toHaveLength(1);
    expect(sizes[0]).toMatchObject({
      severity: 'error',
      expectedCssPx: 24,
      actualCssPx: 18,
      deltaPx: -6,
      measuredVisualHeightPx: 20,
      fontFamily: 'Mark Pro',
    });
  });

  it('flags bold design type rendered at regular weight', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, {
      heading: { text: { fontWeight: 400 } as never },
    });

    const report = await createHarness({ designSpec: REFERENCE_SCENE, liveSpec }).analyze();
    const weights = defectsOfType(report.defects, 'font-weight');

    expect(weights).toHaveLength(1);
    expect(weights[0]).toMatchObject({
      severity: 'warning',
      expectedWeight: 700,
      actualWeight: 400,
    });
  });

  it('flags the wrong typeface when reference renders are available', async () => {
    const renders = buildReferenceRenders({
      text: 'ShipFaster',
      designFamily: 'Mark Pro',
      candidateFamilies: ['Mark Pro', 'Open Sans'],
      fontSizePx: 24,
      fontWeight: 700,
    });

    const liveSpec = mutateScene(REFERENCE_SCENE, {
      heading: { text: { fontFamily: 'Open Sans' } as never },
    });

    const report = await createHarness({
      designSpec: REFERENCE_SCENE,
      liveSpec,
      renders,
      availableFamilies: ['Mark Pro', 'Open Sans'],
      config: {
        checks: {
          fontSize: false,
          spacing: true,
          position: true,
          fontWeight: false,
          fontFamily: true,
          color: true,
          reportUnexpectedElements: true,
        },
      },
    }).analyze();

    const families = defectsOfType(report.defects, 'font-family');
    expect(families).toHaveLength(1);
    expect(families[0]).toMatchObject({
      severity: 'warning',
      expectedFamily: 'Mark Pro',
      actualFamily: 'Open Sans',
    });
  });

  it('skips the family check when no rasterizer is configured', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, {
      heading: { text: { fontFamily: 'Open Sans' } as never },
    });

    const report = await createHarness({ designSpec: REFERENCE_SCENE, liveSpec }).analyze();
    expect(defectsOfType(report.defects, 'font-family')).toEqual([]);
  });
});

describe('QaEngine color regressions', () => {
  it('flags a button fill that drifted to a lighter blue', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, { cta: { background: '#3b82f6' } });

    const report = await createHarness({ designSpec: REFERENCE_SCENE, liveSpec }).analyze();
    const colors = defectsOfType(report.defects, 'color').filter(
      (defect) => defect.role === 'background',
    );

    expect(colors).toHaveLength(1);
    expect(colors[0]).toMatchObject({
      severity: 'error',
      expectedHex: '#2563eb',
      actualHex: '#3b82f6',
      threshold: 4,
    });
    expect(colors[0]?.deltaE2000).toBeGreaterThan(4);
  });

  it('ignores a one-step channel difference', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, { cta: { background: '#2564eb' } });

    const report = await createHarness({ designSpec: REFERENCE_SCENE, liveSpec }).analyze();
    expect(defectsOfType(report.defects, 'color')).toEqual([]);
  });

  it('flags text rendered in the wrong ink color', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, {
      body: { text: { color: '#94a3b8' } as never },
    });

    const report = await createHarness({ designSpec: REFERENCE_SCENE, liveSpec }).analyze();
    const foreground = defectsOfType(report.defects, 'color').filter(
      (defect) => defect.role === 'foreground',
    );

    expect(foreground).toHaveLength(1);
    expect(foreground[0]).toMatchObject({ expectedHex: '#334155', actualHex: '#94a3b8' });
  });
});

describe('QaEngine configuration', () => {
  it('honours a relaxed spacing tolerance', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, {
      cta: shiftElement(elementOf(REFERENCE_SCENE, 'cta'), 0, 8),
    });

    const report = await createHarness({
      designSpec: REFERENCE_SCENE,
      liveSpec,
      config: { tolerances: { spacingPx: 10, positionPx: 10 } },
    }).analyze();

    expect(report.defects).toEqual([]);
    expect(report.tolerances.spacingPx).toBe(10);
  });

  it('can disable individual checks', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, { cta: { background: '#3b82f6' } });

    const report = await createHarness({
      designSpec: REFERENCE_SCENE,
      liveSpec,
      config: {
        checks: {
          color: false,
          spacing: true,
          position: true,
          fontSize: true,
          fontWeight: true,
          fontFamily: true,
          reportUnexpectedElements: true,
        },
      },
    }).analyze();

    expect(defectsOfType(report.defects, 'color')).toEqual([]);
    expect(report.measurements.colors).toEqual([]);
  });

  it('records the tolerances that produced the verdict', async () => {
    const report = await createHarness({ designSpec: REFERENCE_SCENE }).analyze();
    expect(report.tolerances).toEqual({
      spacingPx: 2,
      positionPx: 2,
      fontSizePx: 1,
      deltaE: 4,
      minFamilyMargin: 0.02,
    });
    expect(report.diagnostics.detector).toBe('fake-detector');
    expect(report.diagnostics.textRecognizer).toBe('ink-projection');
  });

  it('stamps the run with the injected clock and configured id', async () => {
    const report = await createHarness({ designSpec: REFERENCE_SCENE }).analyze();
    expect(report.generatedAt).toBe('2026-02-01T12:00:00.000Z');
    expect(report.runId).toBe('test-run');
    expect(report.schemaVersion).toBe(1);
  });
});
