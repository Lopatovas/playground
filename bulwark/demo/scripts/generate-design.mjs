import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const scene = {
  width: 800,
  height: 600,
  pageBackground: '#f8fafc',
  elements: [
    {
      id: 'card',
      box: [40, 40, 440, 260],
      background: '#ffffff',
    },
    {
      id: 'heading',
      box: [56, 64, 424, 108],
      background: '#ffffff',
      text: {
        content: 'ShipFaster',
        fontFamily: 'Mark Pro',
        fontSizePx: 24,
        fontWeight: 700,
        color: '#111827',
      },
    },
    {
      id: 'body',
      box: [56, 132, 424, 168],
      background: '#ffffff',
      text: {
        content: 'Deterministic',
        fontFamily: 'Open Sans',
        fontSizePx: 16,
        fontWeight: 400,
        color: '#334155',
      },
    },
    {
      id: 'cta',
      box: [56, 192, 256, 240],
      background: '#2563eb',
      text: {
        content: 'GetStarted',
        fontFamily: 'Mark Pro',
        fontSizePx: 16,
        fontWeight: 700,
        color: '#ffffff',
      },
    },
  ],
};

const fontProfiles = new Map([
  ['Mark Pro', { visualToCssRatio: 0.82 }],
  ['Open Sans', { visualToCssRatio: 0.85 }],
]);

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputPath = resolve(repoRoot, 'demo/design/figma-screenshot.png');
const crcTable = buildCrcTable();

const raster = createRaster(scene.width, scene.height, parseColor(scene.pageBackground));
for (const element of scene.elements) {
  fillRect(raster, element.box, parseColor(element.background));
  if (element.text !== undefined) {
    drawTextInk(raster, element.box, element.text);
  }
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, encodePng(raster));
console.log(`wrote ${outputPath}`);

function createRaster(width, height, color) {
  const data = Buffer.alloc(width * height * 4);
  const raster = { width, height, data };
  fillRect(raster, [0, 0, width, height], color);
  return raster;
}

function drawTextInk(raster, box, text) {
  const profile = fontProfiles.get(text.fontFamily);
  if (profile === undefined) {
    throw new Error(`Missing font profile for ${text.fontFamily}`);
  }

  const boxHeight = box[3] - box[1];
  const inkHeight = roundHalfAwayFromZero(text.fontSizePx * profile.visualToCssRatio);
  if (inkHeight > boxHeight) {
    throw new RangeError(`${text.content} text ink exceeds its box`);
  }

  const { strokeWidth, gap } = strokeGeometryForWeight(text.fontWeight);
  const count = Math.max(2, text.content.replace(/\s+/g, '').length);
  const top = box[1] + Math.floor((boxHeight - inkHeight) / 2);
  drawGlyphBars(raster, {
    x: box[0] + 8,
    y: top,
    height: inkHeight,
    strokeWidth,
    gap,
    count,
    color: parseColor(text.color),
  });
}

function strokeGeometryForWeight(weight) {
  return weight >= 600 ? { strokeWidth: 4, gap: 4 } : { strokeWidth: 2, gap: 8 };
}

function drawGlyphBars(raster, options) {
  for (let index = 0; index < options.count; index += 1) {
    const x = options.x + index * (options.strokeWidth + options.gap);
    fillRect(
      raster,
      [x, options.y, x + options.strokeWidth, options.y + options.height],
      options.color,
    );
  }
}

function fillRect(raster, box, color) {
  const xMin = clamp(Math.floor(box[0]), 0, raster.width);
  const yMin = clamp(Math.floor(box[1]), 0, raster.height);
  const xMax = clamp(Math.floor(box[2]), 0, raster.width);
  const yMax = clamp(Math.floor(box[3]), 0, raster.height);

  for (let y = yMin; y < yMax; y += 1) {
    for (let x = xMin; x < xMax; x += 1) {
      const offset = (y * raster.width + x) * 4;
      raster.data[offset] = color.r;
      raster.data[offset + 1] = color.g;
      raster.data[offset + 2] = color.b;
      raster.data[offset + 3] = color.a;
    }
  }
}

function encodePng(raster) {
  const rowLength = raster.width * 4;
  const scanlines = Buffer.alloc((rowLength + 1) * raster.height);

  for (let y = 0; y < raster.height; y += 1) {
    const scanlineOffset = y * (rowLength + 1);
    scanlines[scanlineOffset] = 0;
    raster.data.copy(scanlines, scanlineOffset + 1, y * rowLength, (y + 1) * rowLength);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(raster.width, 0);
  ihdr.writeUInt32BE(raster.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function parseColor(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    throw new Error(`Expected a 6-digit hex color, got ${hex}`);
  }

  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
    a: 255,
  };
}

function roundHalfAwayFromZero(value) {
  return value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
