#!/usr/bin/env node
/**
 * Generates blocky PNG brand assets (favicon-32, apple-touch-icon, og placeholder)
 * with a dependency-free PNG encoder (node:zlib). og.png is later replaced by a
 * proper 1200x630 render (see scripts/og via headless browser), but this keeps
 * the build self-sufficient.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, pixelFn) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y);
      const o = rowStart + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const ORANGE = [194, 90, 31];
const YELLOW = [245, 197, 24];
const DARK = [27, 29, 32];

/** Blocky brand mark: orange field, yellow hazard slash, dark base stripe. */
function brandPixel(w, h) {
  return (x, y) => {
    // hazard slash band
    const band = h * 0.35 + (w - x) * (h / w) * 0.35 - h * 0.25;
    if (y > band && y < band + h * 0.1) return YELLOW;
    if (y > h * 0.82) return DARK;
    return ORANGE;
  };
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'favicon-32.png'), png(32, 32, brandPixel(32, 32)));
writeFileSync(join(OUT, 'apple-touch-icon.png'), png(180, 180, brandPixel(180, 180)));
writeFileSync(join(OUT, 'og.png'), png(1200, 630, (x, y) => {
  if (y < 40 || y > 590) return YELLOW;
  if (y < 56 || y > 574) return DARK;
  if (y > 220 && y < 420 && x > 120 && x < 1080) {
    // central dark plate
    if (y < 236 || y > 404 || x < 136 || x > 1064) return YELLOW;
    return DARK;
  }
  return ORANGE;
}));
console.log('PNG assets written to public/');
