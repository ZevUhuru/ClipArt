import { createHash } from "crypto";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ---- .env.local loader ----
const envPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function hashBytes(buf, len = 10) {
  return createHash("sha256").update(buf).digest("hex").slice(0, len);
}

// Internal category -> R2 directory slug
const categoryToDir = {
  food: "thanksgiving",
  christmas: "christmas",
  halloween: "halloween",
  flowers: "flower",
  cats: "cat",
};

// All 29 sample images
const samples = [
  { slug: "pecan-pie-illustration", category: "food", url: "https://assets.codepen.io/9394943/pecan-pie-illustration.png" },
  { slug: "mexican-food-illustration", category: "food", url: "https://assets.codepen.io/9394943/mexican-food-illustration-whitebg-2.png" },
  { slug: "mexican-food-tacos-illustration", category: "food", url: "https://assets.codepen.io/9394943/mexican-food-illustration-whitebg.png" },
  { slug: "produce-basket-illustration", category: "food", url: "https://assets.codepen.io/9394943/produce-basket-illustration-white-bg.png" },
  { slug: "thanksgiving-dinner-illustration", category: "food", url: "https://assets.codepen.io/9394943/thanksgiving-illustration-1-white-bg.png" },
  { slug: "pancake-breakfast-illustration", category: "food", url: "https://assets.codepen.io/9394943/pancake-illustration-1-white-bg.png" },
  { slug: "sitting-santa-claus-illustration", category: "christmas", url: "https://assets.codepen.io/9394943/sitting-santa-illustration.png" },
  { slug: "reindeer-christmas", category: "christmas", url: "https://assets.codepen.io/9394943/reindeer-clipart-white-bg.png" },
  { slug: "realistic-santa-claus-illustration", category: "christmas", url: "https://assets.codepen.io/9394943/life-like-santa-illustration-1-wbg.png" },
  { slug: "smiling-christmas-elves", category: "christmas", url: "https://assets.codepen.io/9394943/smiling-elves-christmas-clip-art-white-background.png" },
  { slug: "christmas-tree-cookie", category: "christmas", url: "https://assets.codepen.io/9394943/christmas-tree-cookie-wbg.png" },
  { slug: "santa-smile-icons", category: "christmas", url: "https://assets.codepen.io/9394943/santa-smiles-icons-white-bg.png" },
  { slug: "witch-pencil-style", category: "halloween", url: "https://assets.codepen.io/9394943/witch-pencil-style-clip-art-white-bg.png" },
  { slug: "witch-with-broomstick-halloween", category: "halloween", url: "https://assets.codepen.io/9394943/african-witch-with-broomstick-white-bg.png" },
  { slug: "two-halloween-pumpkins", category: "halloween", url: "https://assets.codepen.io/9394943/two-halloween-clip-art-pumpkins-white-bg.png" },
  { slug: "halloween-ghost", category: "halloween", url: "https://assets.codepen.io/9394943/halloween-clip-art-ghost-white-bg.png" },
  { slug: "halloween-voodoo-dolls", category: "halloween", url: "https://assets.codepen.io/9394943/halloween-clipart-voodoo-dollas-white-bg.png" },
  { slug: "ghost-and-pumpkin-halloween", category: "halloween", url: "https://assets.codepen.io/9394943/halloween-clipart-ghost-pumpkin-white-bg.png" },
  { slug: "white-rose-in-hair-flower", category: "flowers", url: "https://assets.codepen.io/9394943/white-rose-woman-hair-flower-clipart.png" },
  { slug: "colorful-roses-flower", category: "flowers", url: "https://assets.codepen.io/9394943/colorful-roses-flower-clipart.png" },
  { slug: "girl-holding-flowers", category: "flowers", url: "https://assets.codepen.io/9394943/young-girl-holding-flowers-clipart-white-bg.png" },
  { slug: "pink-rose-flower", category: "flowers", url: "https://assets.codepen.io/9394943/pink-rose-flower-clipart-white-bg.png" },
  { slug: "hawaiian-hibiscus-flower", category: "flowers", url: "https://assets.codepen.io/9394943/hawaiian-biscus-flower-clip-art.png" },
  { slug: "smiling-sunflower-emoji", category: "flowers", url: "https://assets.codepen.io/9394943/single-smiling-sunflower-emoji-flower-clipart.png" },
  { slug: "two-kittens-playing-with-golf-balls", category: "cats", url: "https://assets.codepen.io/9394943/two-kittens-playing-with-golf-balls-in-paint-clip-art.png" },
  { slug: "cute-kittens-holding-golf-clubs", category: "cats", url: "https://assets.codepen.io/9394943/cute-kittens-holding-golf-clubs-clip-art.png" },
  { slug: "kitten-holding-dumbbell", category: "cats", url: "https://assets.codepen.io/9394943/kitten-holding-dumbbell-cat-clip-art.png" },
  { slug: "cats-in-fruit-basket", category: "cats", url: "https://assets.codepen.io/9394943/cats-laying-in-fruit-basket-clip-art.png" },
  { slug: "himalayan-kittens-playing-golf", category: "cats", url: "https://assets.codepen.io/9394943/cute-himalayan-kittens-playing-with-golf-balls-clip-art.png" },
];

// ---- Validate env ----
const bucket = process.env.R2_BUCKET_NAME;
const publicBaseUrl = process.env.R2_PUBLIC_URL || "https://images.clip.art";

if (
  !bucket ||
  !process.env.R2_ENDPOINT ||
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY
) {
  console.error("\n❌ Missing R2 env vars. Check .env.local");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const dryRun = process.argv.includes("--dry");

console.log(`\n=== Seeding ${samples.length} sample images to R2 ===`);
if (dryRun) console.log("(DRY RUN)\n");

let uploaded = 0;
let failed = 0;
const results = [];

for (const img of samples) {
  const dir = categoryToDir[img.category] || "free";
  const idx = `[${uploaded + failed + 1}/${samples.length}]`;

  try {
    // Download from codepen
    const res = await fetch(img.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    let buf = Buffer.from(arrayBuf);

    const originalSize = buf.length;

    // Resize to max 2048px width
    const meta = await sharp(buf).metadata();
    if (meta.width > 2048) {
      buf = await sharp(buf).resize(2048, null, { withoutEnlargement: true }).toBuffer();
    }

    // Convert to WebP
    buf = await sharp(buf).webp({ quality: 85, effort: 6 }).toBuffer();

    const hash = hashBytes(buf, 10);
    const key = `${dir}/${img.slug}.${hash}.webp`;
    const publicUrl = `${publicBaseUrl}/${key}`;

    if (dryRun) {
      console.log(`${idx} ${key} (${(originalSize / 1024).toFixed(0)}KB → ${(buf.length / 1024).toFixed(0)}KB)`);
    } else {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buf,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
          Metadata: {
            category: dir,
            "original-url": img.url,
            "uploaded-at": new Date().toISOString(),
          },
        }),
      );
      console.log(`${idx} ✅ ${publicUrl}`);
    }

    results.push({ slug: img.slug, category: dir, url: publicUrl });
    uploaded++;
  } catch (err) {
    console.error(`${idx} ❌ ${img.slug}: ${err.message}`);
    failed++;
  }
}

console.log(`\n=== Done ===`);
console.log(`Uploaded: ${uploaded}`);
if (failed > 0) console.log(`Failed:   ${failed}`);
if (dryRun) console.log(`(dry run — nothing uploaded)`);

// Print URL mapping for updating sampleGallery.ts
console.log(`\n=== URL Mapping (for sampleGallery.ts) ===`);
for (const r of results) {
  console.log(`  "${r.slug}": "${r.url}",`);
}
