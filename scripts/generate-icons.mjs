// Generates PWA PNG icons. The Sinhala glyph is rendered, trimmed to its true
// bounding box, then composited dead-center on the background — so centering
// does not depend on unreliable SVG baseline metrics.
//   npm run icons
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const GLYPH = "බ";
const FONT = "'Noto Sans Sinhala','Iskoola Pota','Nirmala UI',sans-serif";

// 1) Render the glyph alone on a transparent canvas, then trim to its bounds.
const glyphSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640">
  <text x="320" y="460" text-anchor="middle" font-family="${FONT}"
        font-size="440" font-weight="700" fill="#ffffff">${GLYPH}</text>
</svg>`;

const glyph = await sharp(Buffer.from(glyphSvg), { density: 384 })
  .png()
  .trim()
  .toBuffer();

// 2) Background: rounded gradient square (radius scales with size).
function background(size, radius) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f7931e"/>
        <stop offset="1" stop-color="#ea7317"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
  </svg>`);
}

const targets = [
  { name: "icon-192.png", size: 192, scale: 0.6, radius: 0.22 },
  { name: "icon-512.png", size: 512, scale: 0.6, radius: 0.22 },
  // maskable: glyph kept inside the ~80% safe zone, full-bleed square bg
  { name: "maskable-192.png", size: 192, scale: 0.46, radius: 0 },
  { name: "maskable-512.png", size: 512, scale: 0.46, radius: 0 },
  // apple-touch-icon: opaque square, iOS applies its own rounding
  { name: "apple-icon.png", size: 180, scale: 0.6, radius: 0 },
];

for (const t of targets) {
  const box = Math.round(t.size * t.scale);
  const sizedGlyph = await sharp(glyph)
    .resize({ width: box, height: box, fit: "inside" })
    .toBuffer();

  await sharp(background(t.size, Math.round(t.size * t.radius)))
    .composite([{ input: sizedGlyph, gravity: "center" }])
    .png()
    .toFile(join(outDir, t.name));
  console.log("wrote", t.name);
}
console.log("Done.");
