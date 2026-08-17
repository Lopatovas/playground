import { describe, expect, it } from 'vitest';
import { classifyColorStrategy, rolesForStrategy } from './color-strategy.js';

describe('classifyColorStrategy', () => {
  it('routes solid buttons to fill', () => {
    expect(classifyColorStrategy('Button', 'icon', 0.7)).toBe('fill');
    expect(classifyColorStrategy('primary button', 'text', 0.8)).toBe('fill');
  });

  it('routes text labels to ink', () => {
    expect(classifyColorStrategy('Heading', 'text', 0.9)).toBe('ink');
    expect(classifyColorStrategy('Link', 'text', 0.6)).toBe('ink');
    expect(classifyColorStrategy('Tab', 'container', 0.5)).toBe('ink');
  });

  it('skips sparse photos and large chrome', () => {
    expect(classifyColorStrategy('Image', 'image', 0.1)).toBe('skip');
    expect(classifyColorStrategy('Side Bar', 'container', 0.95)).toBe('skip');
    expect(classifyColorStrategy('List Item', 'container', 0.8)).toBe('skip');
  });

  it('fill-checks solid text inputs (misdetected color chips)', () => {
    expect(classifyColorStrategy('Text Input', 'container', 0.9)).toBe('fill');
    expect(classifyColorStrategy('Text Input', 'container', 0.4)).toBe('skip');
  });

  it('fill-checks solid Text crops (tags / selected days)', () => {
    expect(
      classifyColorStrategy('Text', 'text', 0.9, {}, { r: 220, g: 38, b: 38 }),
    ).toBe('fill');
    // Paper behind body/price copy stays ink.
    expect(
      classifyColorStrategy('Text', 'text', 0.9, {}, { r: 255, g: 255, b: 255 }),
    ).toBe('ink');
    expect(classifyColorStrategy('Text', 'text', 0.4)).toBe('ink');
  });

  it('routes charts and mid-solidity images to palette', () => {
    expect(classifyColorStrategy('Chart', 'image', 0.95)).toBe('palette');
    expect(classifyColorStrategy('Image', 'image', 0.35)).toBe('palette');
  });

  it('inks rating indicators', () => {
    expect(classifyColorStrategy('Rating Indicator', 'icon', 0.5)).toBe('ink');
  });

  it('skips weak fills below the solid share floor', () => {
    expect(classifyColorStrategy('Badge', 'icon', 0.2)).toBe('skip');
    expect(classifyColorStrategy('Button', 'icon', 0.2)).toBe('skip');
  });
});

describe('rolesForStrategy', () => {
  it('maps strategies to comparison roles', () => {
    expect(rolesForStrategy('fill')).toEqual(['background']);
    expect(rolesForStrategy('ink')).toEqual(['foreground']);
    expect(rolesForStrategy('palette')).toEqual(['series']);
    expect(rolesForStrategy('fill+ink')).toEqual(['background', 'foreground']);
    expect(rolesForStrategy('skip')).toEqual([]);
  });
});
