import { describe, expect, it } from 'vitest';
import { ConfigurationError } from '@bulwark/ports';
import { parseConfig } from './config.js';

const MINIMAL = {
  target: {
    url: 'http://localhost:5173/',
    viewport: { width: 1440, height: 900 },
  },
  design: { imagePath: 'design/home.png' },
  services: { detector: { kind: 'omniparser', baseUrl: 'http://omniparser:8000' } },
};

describe('parseConfig', () => {
  it('fills in the documented defaults', () => {
    const config = parseConfig(MINIMAL);

    expect(config.name).toBe('bulwark');
    expect(config.target.viewport.deviceScaleFactor).toBe(1);
    expect(config.target.settleMs).toBe(250);
    expect(config.target.stabilize).toBe(true);
    expect(config.design.pixelRatio).toBe(1);
    expect(config.design.flattenBackground).toBe('#ffffff');
    expect(config.tolerances).toEqual({
      spacingPx: 2,
      positionPx: 2,
      fontSizePx: 1,
      deltaE: 2,
      minFamilyMargin: 0.02,
    });
    expect(config.matching.maxCenterDistancePx).toBe(48);
    expect(config.matching.minIou).toBe(0);
    expect(config.color.clusterCount).toBe(4);
    expect(config.typography.candidateFamilies).toEqual(['Mark Pro', 'Open Sans']);
    expect(config.output.artifactsDir).toBe('.artifacts');
    expect(config.output.failOnDefects).toBe(true);
  });

  it('defaults to the OCR-free recognizer and no reference rendering', () => {
    const config = parseConfig(MINIMAL);
    expect(config.services.recognizer).toEqual({ kind: 'ink-projection' });
    expect(config.services.rasterizer).toEqual({ kind: 'disabled' });
  });

  it('keeps explicit values', () => {
    const config = parseConfig({
      ...MINIMAL,
      design: { imagePath: 'design/home@2x.png', pixelRatio: 2, flattenBackground: '#0f172a' },
      tolerances: { spacingPx: 4, deltaE: 3 },
      services: {
        detector: { kind: 'omniparser', baseUrl: 'http://omniparser:8000', minConfidence: 0.25 },
        recognizer: { kind: 'paddleocr', baseUrl: 'http://paddleocr:8001' },
        rasterizer: { kind: 'playwright' },
        cacheDir: '.bulwark-cache',
      },
    });

    expect(config.design.pixelRatio).toBe(2);
    expect(config.tolerances.spacingPx).toBe(4);
    expect(config.tolerances.deltaE).toBe(3);
    // Untouched siblings still receive their defaults.
    expect(config.tolerances.fontSizePx).toBe(1);
    expect(config.services.recognizer).toMatchObject({ kind: 'paddleocr', timeoutMs: 60_000 });
    expect(config.services.cacheDir).toBe('.bulwark-cache');
  });

  it('accepts a project-specific font profile set', () => {
    const config = parseConfig({
      ...MINIMAL,
      typography: {
        candidateFamilies: ['Inter'],
        profiles: [
          {
            family: 'Inter',
            visualToCssRatio: 0.727,
            weightBands: [{ weight: 400, minStrokeDensity: 0, maxStrokeDensity: 1 }],
          },
        ],
      },
    });

    expect(config.typography.profiles?.[0]).toMatchObject({ family: 'Inter', aliases: [] });
  });

  it('rejects a missing target with a path-qualified message', () => {
    const error = (() => {
      try {
        parseConfig({ design: { imagePath: 'x.png' } });
        return null;
      } catch (caught) {
        return caught;
      }
    })();

    expect(error).toBeInstanceOf(ConfigurationError);
    const issues = (error as ConfigurationError).context['issues'] as string[];
    expect(issues.some((issue) => issue.startsWith('target'))).toBe(true);
    expect(issues.some((issue) => issue.startsWith('services'))).toBe(true);
  });

  it('rejects a non-URL target', () => {
    expect(() => parseConfig({ ...MINIMAL, target: { ...MINIMAL.target, url: 'not-a-url' } })).toThrow(
      ConfigurationError,
    );
  });

  it('rejects out-of-range tolerances instead of clamping them silently', () => {
    expect(() => parseConfig({ ...MINIMAL, tolerances: { spacingPx: -1 } })).toThrow(
      ConfigurationError,
    );
    expect(() => parseConfig({ ...MINIMAL, tolerances: { deltaE: 500 } })).toThrow(
      ConfigurationError,
    );
    expect(() => parseConfig({ ...MINIMAL, matching: { minIou: 2 } })).toThrow(ConfigurationError);
  });

  it('rejects a fractional viewport', () => {
    expect(() =>
      parseConfig({ ...MINIMAL, target: { ...MINIMAL.target, viewport: { width: 100.5, height: 900 } } }),
    ).toThrow(ConfigurationError);
  });

  it('rejects an unknown recognizer kind', () => {
    expect(() =>
      parseConfig({
        ...MINIMAL,
        services: { ...MINIMAL.services, recognizer: { kind: 'tesseract' } },
      }),
    ).toThrow(ConfigurationError);
  });

  it('rejects a malformed hex background', () => {
    expect(() =>
      parseConfig({ ...MINIMAL, design: { imagePath: 'x.png', flattenBackground: 'white' } }),
    ).toThrow(ConfigurationError);
  });

  it('reports every problem at once rather than the first', () => {
    const error = (() => {
      try {
        parseConfig({
          ...MINIMAL,
          tolerances: { spacingPx: -1, deltaE: -1 },
          color: { clusterCount: 99 },
        });
        return null;
      } catch (caught) {
        return caught;
      }
    })();

    const issues = (error as ConfigurationError).context['issues'] as string[];
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });
});
