import { describe, expect, it } from 'vitest';
import {
  clampPercent,
  curtainClipPath,
  curtainComplementClipPath,
  positionFromPointer,
} from './clip-path.js';
import { boxToPercentStyle, fitScale, overlayFrameSize } from './geometry.js';
import { DEFAULT_DEFECT_FILTER, defectHighlightBox, filterDefects } from './defects.js';
import {
  DEFAULT_OVERLAY_STATE,
  clampOpacity,
  liveLayerStyle,
  overlayReducer,
} from './overlay-state.js';
import { parseReport } from './report-schema.js';
import {
  artifactUrl,
  artifactsBaseFromReportUrl,
  reportUrlFromLocation,
} from './urls.js';
import { SAMPLE_REPORT } from '../testing/sample-report.js';

describe('clip-path', () => {
  it('builds complementary polygons for a vertical curtain', () => {
    expect(curtainClipPath(40, 'vertical')).toBe('polygon(0% 0%, 40% 0%, 40% 100%, 0% 100%)');
    expect(curtainComplementClipPath(40, 'vertical')).toBe(
      'polygon(40% 0%, 100% 0%, 100% 100%, 40% 100%)',
    );
  });

  it('builds complementary polygons for a horizontal curtain', () => {
    expect(curtainClipPath(25, 'horizontal')).toBe('polygon(0% 0%, 100% 0%, 100% 25%, 0% 25%)');
    expect(curtainComplementClipPath(25, 'horizontal')).toBe(
      'polygon(0% 25%, 100% 25%, 100% 100%, 0% 100%)',
    );
  });

  it('clamps out-of-range curtain positions', () => {
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
  });

  it('maps pointer position into a percentage of the overlay', () => {
    const bounds = { left: 100, top: 50, width: 200, height: 100 };
    expect(positionFromPointer({ clientX: 150, clientY: 50 }, bounds, 'vertical')).toBe(25);
    expect(positionFromPointer({ clientX: 100, clientY: 100 }, bounds, 'horizontal')).toBe(50);
  });
});

describe('geometry', () => {
  it('positions a box as percentages of its surface', () => {
    expect(boxToPercentStyle({ xMin: 100, yMin: 50, xMax: 300, yMax: 150 }, { width: 800, height: 600 })).toEqual({
      left: '12.5%',
      top: '8.333%',
      width: '25%',
      height: '16.667%',
    });
  });

  it('never upscales a surface to fit', () => {
    expect(fitScale({ width: 400, height: 300 }, { width: 800, height: 600 })).toBe(1);
    expect(fitScale({ width: 1600, height: 900 }, { width: 800, height: 600 })).toBe(0.5);
  });

  it('frames both surfaces without stretching either', () => {
    expect(
      overlayFrameSize({ width: 1440, height: 900 }, { width: 1280, height: 960 }),
    ).toEqual({ width: 1440, height: 960 });
  });
});

describe('overlay state', () => {
  it('switches modes and clamps opacity', () => {
    const withMode = overlayReducer(DEFAULT_OVERLAY_STATE, { type: 'set-mode', mode: 'difference' });
    expect(withMode.mode).toBe('difference');
    expect(overlayReducer(withMode, { type: 'set-opacity', opacity: 1.5 }).opacity).toBe(1);
    expect(clampOpacity(-0.2)).toBe(0);
  });

  it('maps each mode onto the CSS the live layer needs', () => {
    expect(liveLayerStyle({ ...DEFAULT_OVERLAY_STATE, mode: 'opacity', opacity: 0.35 })).toEqual({
      opacity: 0.35,
      mixBlendMode: 'normal',
    });
    expect(liveLayerStyle({ ...DEFAULT_OVERLAY_STATE, mode: 'difference' })).toEqual({
      opacity: 1,
      mixBlendMode: 'difference',
    });
    expect(liveLayerStyle({ ...DEFAULT_OVERLAY_STATE, mode: 'curtain' })).toEqual({
      opacity: 1,
      mixBlendMode: 'normal',
    });
  });

  it('resets to the defaults', () => {
    const dirty = overlayReducer(DEFAULT_OVERLAY_STATE, { type: 'set-opacity', opacity: 0.1 });
    expect(overlayReducer(dirty, { type: 'reset' })).toEqual(DEFAULT_OVERLAY_STATE);
  });
});

describe('defects', () => {
  it('filters by severity, type and free text without reshuffling', () => {
    const filtered = filterDefects(SAMPLE_REPORT.defects, {
      ...DEFAULT_DEFECT_FILTER,
      severity: 'error',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('spacing:vertical:heading->body');

    expect(
      filterDefects(SAMPLE_REPORT.defects, { ...DEFAULT_DEFECT_FILTER, query: 'button' }).map(
        (defect) => defect.id,
      ),
    ).toEqual(['color:background:cta']);
  });

  it('prefers the design box for highlighting', () => {
    expect(defectHighlightBox(SAMPLE_REPORT.defects[0]!)).toEqual({
      surface: 'design',
      box: SAMPLE_REPORT.defects[0]!.designBox,
    });
  });
});

describe('report schema', () => {
  it('accepts a valid report', () => {
    const parsed = parseReport(SAMPLE_REPORT);
    expect(parsed.ok).toBe(true);
  });

  it('rejects an incompatible schema version with a readable message', () => {
    const parsed = parseReport({ ...SAMPLE_REPORT, schemaVersion: 99 });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.message).toContain('does not match');
    expect(parsed.issues.some((issue) => issue.includes('schemaVersion'))).toBe(true);
  });
});

describe('urls', () => {
  it('resolves artifact URLs next to the report', () => {
    expect(artifactUrl('live-screenshot.png', '/artifacts/')).toBe('/artifacts/live-screenshot.png');
    expect(artifactUrl('live-screenshot.png', 'https://cdn.example/runs/one/')).toBe(
      'https://cdn.example/runs/one/live-screenshot.png',
    );
    expect(reportUrlFromLocation('?report=/runs/one/report.json')).toBe('/runs/one/report.json');
    expect(reportUrlFromLocation('')).toBe('/artifacts/report.json');
    expect(artifactsBaseFromReportUrl('/runs/one/report.json')).toBe('/runs/one/');
    expect(artifactsBaseFromReportUrl('https://cdn.example/runs/one/report.json')).toBe(
      'https://cdn.example/runs/one/',
    );
    expect(artifactsBaseFromReportUrl('/api/runs/run-fixed/report')).toBe(
      '/api/runs/run-fixed/artifacts/',
    );
  });
});
