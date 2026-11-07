// Regenerates the PWA PNG icons in /public from pure code (orbit-core:
// gold outer ring, violet ring, tilted cyan orbit, glowing cyan core on
// deep navy). The PNGs are binary, so they are NOT part of the text-only
// GitHub snapshot push — run this once after cloning if /public icons are
// missing, or let the manifest fall back to /api/icons/*.svg twins.
// Requires: npm i -D pngjs  (or any PNG writer) — kept out of runtime deps.
import { writeFileSync } from "node:fs";

// Tiny self-contained PNG writer (RGBA, zlib via node:zlib).
import { deflateSync } from "node:zlib";
const CRC_TABLE = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
function render(size) {
  const px = Buffer.alloc(size * size * 4);
  const C = size / 2, S = size / 512;
  const dist = (x, y) => Math.hypot(x - C, y - C);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, d = dist(x, y);
    let r = 4, g = 6, b = 15; // deep navy
    const ring = (rad, wdt, col) => { if (Math.abs(d - rad * S) < wdt * S) [r, g, b] = col; };
    ring(168, 7, [232, 178, 58]);           // gold outer ring
    ring(112, 5, [124, 92, 255]);           // violet ring
    const t = -24 * Math.PI / 180, dx = x - C, dy = y - C;
    const ex = dx * Math.cos(t) - dy * Math.sin(t), ey = dx * Math.sin(t) + dy * Math.cos(t);
    if (Math.abs(Math.hypot(ex / (200 * S), ey / (76 * S)) - 1) < 0.045) [r, g, b] = [0, 242, 254]; // cyan orbit ellipse
    if (d < 52 * S) { const f = 1 - d / (52 * S); r = 0 + 185 * f; g = 194 + 57 * f; b = 216 + 39 * f; } // glowing core
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  }
  return encodePNG(size, size, px);
}
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), render(size));
  console.log("wrote", name, size);
}
