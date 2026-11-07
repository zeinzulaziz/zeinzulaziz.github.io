// Responsive WebP derivatives for the cards and the project pages.
//
// Run by hand when a screenshot changes:
//   node tools/build-images.mjs
//
// The outputs are committed, so neither the CI build nor a visitor needs an
// image encoder on the other end. It needs `cwebp` (macOS: brew install webp).
//
// Why this exists: one 2764px screenshot used to be the source for a 104px
// card thumbnail and an 832px page hero at once, so every visitor downloaded
// 113 KB to draw a small square. The generated widths let srcset pick.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const imgDir = join(root, "assets", "img");
const CWEBP = process.env.CWEBP || "cwebp";
const QUALITY = 82;

/* Widths that the layout can actually ask for:
   104px card thumb (x2 = 208), ~500px featured card (x2 = 1000),
   ~832px project hero (x2 = 1664). */
const WIDTHS = [200, 400, 800, 1200, 1600];

const JOBS = [
  { name: "invoice" },
  { name: "harga-pangan" },
  { name: "convert-gold" },
  { name: "broken-link-checker" },
  // Shown at 15rem (240px) at most, so one small step is enough.
  { name: "avatar-anime", widths: [240] },
];

// Same header read as build.mjs uses for intrinsic size.
function webpSize(file) {
  const buf = readFileSync(file);
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const kind = buf.toString("ascii", 12, 16);
  if (kind === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (kind === "VP8X") return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
  return null;
}

let made = 0;
let skipped = 0;
let bytes = 0;

for (const job of JOBS) {
  const source = join(imgDir, `${job.name}.webp`);
  if (!existsSync(source)) {
    console.warn(`  lewati ${job.name}: sumber tidak ada`);
    continue;
  }
  const size = webpSize(source);
  if (!size) {
    console.warn(`  lewati ${job.name}: bukan WebP yang bisa dibaca`);
    continue;
  }

  const widths = (job.widths || WIDTHS).filter((w) => w < size.width);
  for (const width of widths) {
    const out = join(imgDir, `${job.name}-${width}.webp`);
    // Cheap mtime check: regenerate only when the source is newer.
    if (existsSync(out) && statSync(out).mtimeMs > statSync(source).mtimeMs) {
      skipped++;
      continue;
    }
    execFileSync(
      CWEBP,
      ["-quiet", "-q", String(QUALITY), "-m", "6", "-resize", String(width), "0", source, "-o", out],
      { stdio: "inherit" }
    );
    made++;
    bytes += statSync(out).size;
  }
  console.log(`  ${job.name} (${size.width}x${size.height}) -> ${widths.length} ukuran`);
}

console.log(`selesai: ${made} berkas dibuat (${(bytes / 1024).toFixed(0)} KB), ${skipped} sudah baru`);
