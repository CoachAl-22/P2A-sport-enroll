import { deflateRawSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

// Orange: #F26522  R=242, G=101, B=34
// Black bg: #0a0a0a R=10,  G=10,  B=10
const BG  = [10,  10,  10,  255];
const OG  = [242, 101, 34,  255];

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let v = i;
    for (let j = 0; j < 8; j++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    table[i] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([typeBytes, data]);
  const crc  = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function makePng(size) {
  const r = size / 2;         // radius for circle background
  const pad = Math.round(size * 0.12);
  const rows = [];

  for (let y = 0; y < size; y++) {
    const row = [0]; // filter byte
    for (let x = 0; x < size; x++) {
      const dx = x - size / 2 + 0.5;
      const dy = y - size / 2 + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded rectangle: fill orange, black background outside
      const rx = size * 0.18; // corner radius ratio
      const hw = size / 2 - pad;
      const adx = Math.abs(dx) - hw + rx;
      const ady = Math.abs(dy) - hw + rx;
      const inRect = adx <= rx && ady <= rx &&
                     (adx <= 0 || ady <= 0 || adx * adx + ady * ady <= rx * rx);

      row.push(...(inRect ? OG : BG));
    }
    rows.push(Buffer.from(row));
  }

  const raw = Buffer.concat(rows);
  const idat = deflateRawSync(raw, { level: 9 });

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type RGB (we'll use RGBA → type 6)
  // redo as RGBA
  ihdr[9] = 6;
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync("public/icons", { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
for (const s of sizes) {
  const png = makePng(s);
  writeFileSync(`public/icons/icon-${s}.png`, png);
  console.log(`Generated icon-${s}.png (${png.length} bytes)`);
}

// Placeholder screenshot (390x844)
// Just a solid dark image
function makeScreenshot(w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = [0]; // filter
    for (let x = 0; x < w; x++) row.push(...BG);
    rows.push(Buffer.from(row));
  }
  const raw  = Buffer.concat(rows);
  const idat = deflateRawSync(raw, { level: 1 });
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

writeFileSync("public/icons/screenshot-mobile.png", makeScreenshot(390, 844));
console.log("Generated screenshot-mobile.png");
