import { PNG } from 'pngjs';
import type { Raster } from './raster.js';
import { rasterFromBuffer } from './raster.js';

/**
 * Decodes a PNG into an RGBA raster.
 *
 * PNG is the only format the pipeline accepts: it is lossless, so a design export
 * and a browser screenshot both survive the round trip unchanged. JPEG artefacts
 * would show up as color and ink-density defects that exist only in the encoder.
 */
export function decodePng(bytes: Uint8Array): Raster {
  const png = PNG.sync.read(Buffer.from(bytes));
  return rasterFromBuffer(png.width, png.height, new Uint8Array(png.data));
}

export function encodePng(raster: Raster): Uint8Array {
  const png = new PNG({ width: raster.width, height: raster.height });
  png.data = Buffer.from(raster.data);
  return new Uint8Array(
    PNG.sync.write(png, {
      // Fixed encoder settings so the same raster always produces the same bytes.
      deflateLevel: 9,
      deflateStrategy: 3,
      filterType: 0,
    }),
  );
}
