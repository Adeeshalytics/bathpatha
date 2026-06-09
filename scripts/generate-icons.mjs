// Generates PWA PNG icons from public/icon-source.svg using sharp.
//   npm run icons
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public", "icon-source.svg"));
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "maskable-192.png", size: 192, pad: 0.12 },
  { name: "maskable-512.png", size: 512, pad: 0.12 },
  { name: "apple-icon.png", size: 180, bg: "#ea7317" },
];

for (const t of targets) {
  let img = sharp(svg, { density: 384 }).resize(t.size, t.size);
  if (t.bg) {
    img = img.flatten({ background: t.bg });
  }
  await img.png().toFile(join(outDir, t.name));
  console.log("wrote", t.name);
}
console.log("Done.");
