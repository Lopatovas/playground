import type { DashboardReport } from '../lib/report-schema.js';

export const SAMPLE_REPORT: DashboardReport = {
  schemaVersion: 1,
  runId: 'run-demo',
  generatedAt: '2026-02-01T12:00:00.000Z',
  target: {
    url: 'http://localhost:4173/',
    viewport: { width: 800, height: 600, deviceScaleFactor: 1 },
  },
  surfaces: {
    design: {
      imagePath: 'figma-screenshot.png',
      width: 800,
      height: 600,
      imageSha256: 'design',
    },
    live: {
      imagePath: 'live-screenshot.png',
      width: 800,
      height: 600,
      imageSha256: 'live',
    },
  },
  tolerances: {
    spacingPx: 2,
    positionPx: 2,
    fontSizePx: 1,
    deltaE: 2,
    minFamilyMargin: 0.02,
  },
  summary: {
    passed: false,
    totalDefects: 2,
    bySeverity: { error: 1, warning: 1 },
    byType: { spacing: 1, color: 1 },
    designElementCount: 4,
    liveElementCount: 4,
    matchedElementCount: 4,
    matchRate: 1,
  },
  defects: [
    {
      id: 'spacing:vertical:heading->body',
      type: 'spacing',
      severity: 'error',
      message: 'Extra vertical space between "heading" and "body"',
      designBox: { xMin: 56, yMin: 64, xMax: 424, yMax: 168 },
      designElementId: 'design-002',
    },
    {
      id: 'color:background:cta',
      type: 'color',
      severity: 'warning',
      message: '"primary button" background is #3b82f6 but the design uses #2563eb',
      designBox: { xMin: 56, yMin: 192, xMax: 256, yMax: 240 },
      designElementId: 'design-004',
      expectedHex: '#2563eb',
      actualHex: '#3b82f6',
      deltaE2000: 8.2,
      threshold: 2,
      role: 'background',
    },
  ],
  measurements: {
    designElements: [],
    liveElements: [],
    pairs: [],
    spacing: [],
    typography: [],
    colors: [],
  },
  diagnostics: {
    warnings: ['Skipped 1 spacing comparison'],
    detector: 'omniparser',
    textRecognizer: 'ink-projection',
    durationMs: 42,
  },
};
