const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create RGBA PNG with 2-arrow loading/refresh symbol in the center
function createPNG(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = createChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const R = width * 0.28; // Arc radius
  const thickness = width * 0.055; // Stroke thickness
  const arrowHeadSize = width * 0.12;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Base gradient: Royal Blue (#1D4ED8) to Electric Cyan (#22D3EE)
      const t = (x + y) / (width + height);
      let pr = Math.round(29 * (1 - t) + 34 * t);
      let pg = Math.round(78 * (1 - t) + 211 * t);
      let pb = Math.round(216 * (1 - t) + 238 * t);
      let pa = 255;

      // 2-Arrow Circular Loading Symbol in white
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx); // [-PI, PI]

      let isSymbol = false;

      // Arc 1: Top right quadrant (-0.2 * PI to 0.75 * PI)
      // Arc 2: Bottom left quadrant (0.8 * PI to -0.25 * PI)
      const inRing = Math.abs(dist - R) <= thickness / 2;
      const inArc1 = (angle >= -0.2 * Math.PI && angle <= 0.75 * Math.PI);
      const inArc2 = (angle <= -0.25 * Math.PI || angle >= 0.8 * Math.PI);

      if (inRing && (inArc1 || inArc2)) {
        isSymbol = true;
      }

      // Arrow head 1 (at end of Arc 1, near top-right):
      const tip1X = cx + R * Math.cos(-0.2 * Math.PI);
      const tip1Y = cy + R * Math.sin(-0.2 * Math.PI);
      const dTip1 = Math.sqrt((x - tip1X) ** 2 + (y - tip1Y) ** 2);
      if (dTip1 <= arrowHeadSize && x >= tip1X - arrowHeadSize * 0.3 && y <= tip1Y + arrowHeadSize) {
        if (x - tip1X <= (tip1Y - y) + arrowHeadSize * 0.4) {
          isSymbol = true;
        }
      }

      // Arrow head 2 (at end of Arc 2, near bottom-left):
      const tip2X = cx + R * Math.cos(0.8 * Math.PI);
      const tip2Y = cy + R * Math.sin(0.8 * Math.PI);
      const dTip2 = Math.sqrt((x - tip2X) ** 2 + (y - tip2Y) ** 2);
      if (dTip2 <= arrowHeadSize && x <= tip2X + arrowHeadSize * 0.3 && y >= tip2Y - arrowHeadSize) {
        if (tip2X - x <= (y - tip2Y) + arrowHeadSize * 0.4) {
          isSymbol = true;
        }
      }

      if (isSymbol) {
        // Pure White icon (#FFFFFF)
        pr = 255;
        pg = 255;
        pb = 255;
      }

      rawData[pxOffset] = pr;
      rawData[pxOffset + 1] = pg;
      rawData[pxOffset + 2] = pb;
      rawData[pxOffset + 3] = pa;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.slice(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

const iconsDir = path.resolve(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPNG(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-192-maskable.png'), createPNG(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPNG(512, 512));
fs.writeFileSync(path.join(iconsDir, 'icon-512-maskable.png'), createPNG(512, 512));

console.log('✅ Generated 192x192 and 512x512 PWA icons with 2-arrow loading symbol');
