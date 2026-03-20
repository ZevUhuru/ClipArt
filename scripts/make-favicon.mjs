import sharp from "sharp";

const src = "/Users/lem/.cursor/projects/Users-lem-Desktop-Projects-Dev-apps-clip-art/assets/favicon-scissors.png";

// The original image has a rounded-square icon on a white background.
// We want to make the white corners transparent so only the rounded shape remains.

const img = sharp(src);
const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

// Any pixel that's close to white (r>200, g>200, b>200) becomes transparent
const newData = Buffer.from(data);
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  if (r > 200 && g > 200 && b > 200) {
    newData[i + 3] = 0; // set alpha to 0
  }
}

const transparent = await sharp(newData, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim()
  .png()
  .toBuffer();

// Generate all sizes
await sharp(transparent).resize(32, 32).png().toFile("public/favicon.ico");
await sharp(transparent).resize(192, 192).png().toFile("public/icon.png");
await sharp(transparent).resize(180, 180).png().toFile("public/apple-icon.png");

// Verify
const check = await sharp("public/icon.png").raw().ensureAlpha().toBuffer({ resolveWithObject: true });
const tl = { r: check.data[0], g: check.data[1], b: check.data[2], a: check.data[3] };
console.log("Top-left pixel:", tl);
console.log(tl.a === 0 ? "✅ Corners are transparent" : "Corner alpha:" + tl.a);
console.log("Done — favicon.ico, icon.png, apple-icon.png created");
