const fs = require("node:fs");
const path = require("node:path");

// Metro 0.80 expects image-size 1.x's callable CommonJS export. The patched
// image-size 2.x exposes imageSize instead and expects bytes rather than paths.
const metroAssets = path.join(
  __dirname,
  "..",
  "node_modules",
  "metro",
  "src",
  "Assets.js",
);
const original = 'const getImageSize = require("image-size");';
const replacement = `const { imageSize } = require("image-size");
const getImageSize = (input) =>
  imageSize(typeof input === "string" ? fs.readFileSync(input) : input);`;

const source = fs.readFileSync(metroAssets, "utf8");
if (source.includes(replacement)) {
  process.exit(0);
}
if (!source.includes(original)) {
  throw new Error("Metro's image-size API changed; review the compatibility patch.");
}
fs.writeFileSync(metroAssets, source.replace(original, replacement));