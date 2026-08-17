export interface TextRenderRequest {
  readonly text: string;
  readonly fontFamily: string;
  readonly fontSizePx: number;
  readonly fontWeight: number;
  /** Hex color for the glyphs. */
  readonly color: string;
  /** Hex color behind the glyphs. */
  readonly backgroundColor: string;
  readonly letterSpacingPx?: number;
}

export interface TextRenderResult {
  /** PNG bytes of the rendered string, trimmed to the text with a small margin. */
  readonly image: Uint8Array;
  readonly width: number;
  readonly height: number;
  /** Family the renderer actually resolved, so a missing font is detectable. */
  readonly resolvedFontFamily: string;
}

/**
 * Renders a string in a named family, producing the reference images the font-family
 * check compares against.
 *
 * This must run through something that has the real typefaces installed; there is no
 * way to infer what Mark Pro looks like from arithmetic. The interface exists so the
 * comparison logic can be tested with stand-in renders, and so a missing font shows
 * up as a reported condition rather than a silent fallback to the default sans.
 */
export interface TextRasterizer {
  readonly name: string;
  render(request: TextRenderRequest): Promise<TextRenderResult>;
  /**
   * Optional batch render of the same string at many sizes (one document).
   * Used by size-fit to cut Playwright round-trips.
   */
  renderMany?(
    request: Omit<TextRenderRequest, 'fontSizePx'>,
    sizesPx: readonly number[],
  ): Promise<readonly (TextRenderResult & { readonly fontSizePx: number })[]>;
  /** Families the renderer can actually resolve, for start-up validation. */
  listAvailableFamilies?(): Promise<readonly string[]>;
  /** Release browsers / pages held open across renders. */
  close?(): Promise<void>;
}
