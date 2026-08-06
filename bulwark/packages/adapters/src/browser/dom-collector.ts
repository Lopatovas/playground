/**
 * The DOM walk that runs inside the page.
 *
 * It is kept as a standalone string-serializable function so it can be unit tested
 * against a jsdom-like document without launching a browser, and so the Playwright
 * adapter stays a thin transport around it.
 */

export interface CollectedElement {
  id: string;
  tagName: string;
  box: { xMin: number; yMin: number; xMax: number; yMax: number };
  text: string | null;
  style: {
    fontFamily: string;
    fontSizePx: number;
    fontWeight: number;
    lineHeightPx: number | null;
    letterSpacingPx: number | null;
    color: string;
    backgroundColor: string;
    borderRadiusPx: number | null;
    opacity: number;
  };
  hasTransparentBackground: boolean;
  depth: number;
}

export interface CollectOptions {
  /** Elements smaller than this in either dimension are skipped. */
  minSizePx: number;
  /** Hard ceiling on returned elements, to bound payload size on huge pages. */
  maxElements: number;
  /** Tag names never collected. */
  ignoredTags: string[];
  /** Add the current scroll offset, for full-page captures. */
  includeScrollOffset: boolean;
}

export const DEFAULT_COLLECT_OPTIONS: CollectOptions = {
  minSizePx: 4,
  maxElements: 2000,
  ignoredTags: ['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'TITLE', 'NOSCRIPT', 'TEMPLATE', 'BR'],
  includeScrollOffset: true,
};

export function collectDomElements(options: CollectOptions): CollectedElement[] {
  const ignored = new Set(options.ignoredTags);
  const results: CollectedElement[] = [];
  const scrollX = options.includeScrollOffset ? window.scrollX : 0;
  const scrollY = options.includeScrollOffset ? window.scrollY : 0;

  const identify = (element: Element): string => {
    const segments: string[] = [];
    let current: Element | null = element;
    while (current !== null && current.tagName !== 'HTML') {
      const node: Element = current;
      const parent: Element | null = node.parentElement;
      const tag = node.tagName.toLowerCase();
      if (parent === null) {
        segments.unshift(tag);
        break;
      }
      const siblings = Array.from(parent.children).filter(
        (sibling) => sibling.tagName === node.tagName,
      );
      const index = siblings.indexOf(node);
      segments.unshift(siblings.length > 1 ? `${tag}[${index + 1}]` : tag);
      current = parent;
    }
    return segments.join('>');
  };

  /** Text this element renders itself, ignoring text owned by its children. */
  const ownText = (element: Element): string | null => {
    let text = '';
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === 3) text += node.textContent ?? '';
    }
    const trimmed = text.replace(/\s+/g, ' ').trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const parsePx = (value: string): number | null => {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const isTransparent = (color: string): boolean => {
    if (color === 'transparent') return true;
    const match = /^rgba?\(([^)]+)\)$/.exec(color);
    if (match === null) return false;
    const parts = (match[1] ?? '').split(/[\s,/]+/).filter((part) => part.length > 0);
    if (parts.length < 4) return false;
    return Number.parseFloat(parts[3] ?? '1') === 0;
  };

  const walk = (element: Element, depth: number): void => {
    if (results.length >= options.maxElements) return;
    if (ignored.has(element.tagName)) return;

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const visible =
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      Number.parseFloat(style.opacity) > 0;

    if (visible && rect.width >= options.minSizePx && rect.height >= options.minSizePx) {
      results.push({
        id: identify(element),
        tagName: element.tagName.toLowerCase(),
        box: {
          xMin: rect.left + scrollX,
          yMin: rect.top + scrollY,
          xMax: rect.right + scrollX,
          yMax: rect.bottom + scrollY,
        },
        text: ownText(element),
        style: {
          fontFamily: style.fontFamily,
          fontSizePx: parsePx(style.fontSize) ?? 0,
          fontWeight: normalizeWeight(style.fontWeight),
          lineHeightPx: parsePx(style.lineHeight),
          letterSpacingPx: parsePx(style.letterSpacing),
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderRadiusPx: parsePx(style.borderTopLeftRadius),
          opacity: Number.parseFloat(style.opacity),
        },
        hasTransparentBackground: isTransparent(style.backgroundColor),
        depth,
      });
    }

    // Hidden subtrees still get walked: a child can be visible inside a parent
    // that has zero size, as with absolutely-positioned content.
    for (const child of Array.from(element.children)) {
      walk(child, depth + 1);
    }
  };

  function normalizeWeight(value: string): number {
    const named: Record<string, number | undefined> = {
      normal: 400,
      bold: 700,
      lighter: 300,
      bolder: 700,
    };
    const mapped = named[value];
    if (mapped !== undefined) return mapped;
    const numeric = Number.parseInt(value, 10);
    return Number.isFinite(numeric) ? numeric : 400;
  }

  if (document.body !== null) walk(document.body, 0);
  return results;
}
