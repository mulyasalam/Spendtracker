import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const iconDir = new URL("../public/icons/", import.meta.url);
const svg = await readFile(new URL("icon.svg", iconDir));

await mkdir(iconDir, { recursive: true });

function iconPath(name) {
  return fileURLToPath(new URL(name, iconDir));
}

await Promise.all([
  sharp(svg).resize(32, 32).png().toFile(iconPath("favicon-32.png")),
  sharp(svg).resize(180, 180).png().toFile(iconPath("apple-touch-icon.png")),
  sharp(svg).resize(192, 192).png().toFile(iconPath("icon-192.png")),
  sharp(svg).resize(512, 512).png().toFile(iconPath("icon-512.png")),
  sharp(svg).resize(512, 512).png().toFile(iconPath("maskable-512.png"))
]);

console.log("Generated iOS and PWA icons.");
