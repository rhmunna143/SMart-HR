// One-off icon generator: renders app/icon.svg into raster PNGs + favicon.ico.
// Run from the frontend dir:  node scripts/gen-icons.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = join(root, 'src', 'app');
const publicDir = join(root, 'public');
const svg = readFileSync(join(appDir, 'icon.svg'));

const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png();

// Wrap a single PNG buffer into a valid .ico (ICO supports embedded PNG).
function pngToIco(pngBuf, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 => 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuf.length, 8); // size of image data
  entry.writeUInt32LE(6 + 16, 12); // offset of image data

  return Buffer.concat([header, entry, pngBuf]);
}

const main = async () => {
  // Next.js App Router auto-wires these from src/app/
  await png(180).toFile(join(appDir, 'apple-icon.png'));
  await png(512).toFile(join(appDir, 'icon.png'));

  // Replace the default favicon.ico with a 256px PNG-based ico
  const icoPng = await png(256).toBuffer();
  writeFileSync(join(appDir, 'favicon.ico'), pngToIco(icoPng, 256));

  // A standalone logo mark for use as a public asset (og/share, docs, etc.)
  await png(512).toFile(join(publicDir, 'logo-mark.png'));

  console.log('Icons generated: apple-icon.png, icon.png, favicon.ico, public/logo-mark.png');
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
