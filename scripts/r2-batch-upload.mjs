import { createHash } from "crypto";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";
import mime from "mime-types";
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

// ---- Utilities ----
const VALID_CATEGORIES = [
  "christmas",
  "heart",
  "halloween",
  "flower",
  "school",
  "book",
  "pumpkin",
  "cat",
  "thanksgiving",
  "free",
];

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]);

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function hashBytes(buf, len = 10) {
  return createHash("sha256").update(buf).digest("hex").slice(0, len);
}

// ---- CLI ----
// Usage:
//   node scripts/r2-batch-upload.mjs --dir=./generated/flower --category=flower
//   node scripts/r2-batch-upload.mjs --dir=./generated/christmas --category=christmas --dry
//   node scripts/r2-batch-upload.mjs --dir=./output --category=heart --max-width=1024
//
// Args:
//   --dir        (required) Directory containing images to upload
//   --category   (required) Target category
//   --no-webp    (optional) Skip WebP conversion
//   --max-width  (optional) Max width in px; defaults to 2048
//   --dry        (optional) Print upload plan without uploading

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.split("="))
    .map(([k, v]) => [k.replace(/^--/, ""), v ?? true]),
);

const dirPath = args.dir;
const category = slugify(String(args.category || ""));
const dryRun = args.dry === true || args.dry === "true";
const noWebp = args["no-webp"] === true || args["no-webp"] === "true";
const maxWidth = parseInt(args["max-width"] || "2048", 10);

if (!dirPath || !category) {
  console.error(
    `Missing args.\n\nUsage:\n  node scripts/r2-batch-upload.mjs --dir=./generated/flower --category=flower\n\nRequired:\n  --dir        Directory containing images\n  --category   ${VALID_CATEGORIES.join(", ")}\n\nOptional:\n  --no-webp    Skip WebP conversion\n  --max-width  Max width in px (default: 2048)\n  --dry        Dry run`,
  );
  process.exit(1);
}

if (!VALID_CATEGORIES.includes(category)) {
  console.error(
    `\n❌ Invalid category: "${category}"\n   Valid: ${VALID_CATEGORIES.join(", ")}`,
  );
  process.exit(1);
}

if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
  console.error(`\n❌ Directory not found: ${dirPath}`);
  process.exit(1);
}

// ---- Collect image files ----
const files = readdirSync(dirPath)
  .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
  .sort();

if (files.length === 0) {
  console.error(`\n❌ No image files found in: ${dirPath}`);
  process.exit(1);
}

console.log(`\n=== Batch Upload: ${files.length} images → ${category}/ ===\n`);

// ---- R2 client ----
const bucket = process.env.R2_BUCKET_NAME;
const publicBaseUrl = process.env.R2_PUBLIC_URL || "https://images.clip.art";

let client;
if (!dryRun) {
  if (
    !bucket ||
    !process.env.R2_ENDPOINT ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    console.error(
      "\n❌ Missing env vars. Set: R2_BUCKET_NAME, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY",
    );
    process.exit(1);
  }

  client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// ---- Process and upload ----
let uploaded = 0;
let totalOriginalBytes = 0;
let totalFinalBytes = 0;
const urls = [];

for (const file of files) {
  const filePath = path.join(dirPath, file);
  const baseName = slugify(path.parse(file).name);
  const originalExt = path.extname(file).toLowerCase();
  const skipConversion = [".svg", ".gif"].includes(originalExt);
  const convertToWebp = !noWebp && !skipConversion;

  let buf = readFileSync(filePath);
  let ext = originalExt;
  let contentType = mime.lookup(ext) || "application/octet-stream";

  totalOriginalBytes += buf.length;

  // Resize if needed
  if (!skipConversion) {
    const meta = await sharp(buf).metadata();
    if (meta.width > maxWidth) {
      buf = await sharp(buf).resize(maxWidth, null, { withoutEnlargement: true }).toBuffer();
    }
  }

  // Convert to WebP
  if (convertToWebp) {
    buf = await sharp(buf).webp({ quality: 85, effort: 6 }).toBuffer();
    ext = ".webp";
    contentType = "image/webp";
  }

  totalFinalBytes += buf.length;

  const hash = hashBytes(buf, 10);
  const key = `${category}/${baseName}.${hash}${ext}`;
  const publicUrl = `${publicBaseUrl}/${key}`;

  const idx = `[${uploaded + 1}/${files.length}]`;

  if (dryRun) {
    console.log(`${idx} ${key} (${(buf.length / 1024).toFixed(0)}KB)`);
  } else {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buf,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: {
          category,
          "original-filename": file,
          "uploaded-at": new Date().toISOString(),
        },
      }),
    );
    console.log(`${idx} ✅ ${publicUrl}`);
  }

  urls.push(publicUrl);
  uploaded++;
}

// ---- Summary ----
const originalMB = (totalOriginalBytes / (1024 * 1024)).toFixed(1);
const finalMB = (totalFinalBytes / (1024 * 1024)).toFixed(1);
const savings = ((1 - totalFinalBytes / totalOriginalBytes) * 100).toFixed(0);

console.log(`\n=== Summary ===`);
console.log(`Images:    ${uploaded}`);
console.log(`Category:  ${category}/`);
console.log(`Size:      ${originalMB}MB → ${finalMB}MB (${savings}% smaller)`);
if (dryRun) {
  console.log(`Mode:      DRY RUN (nothing uploaded)`);
} else {
  console.log(`Status:    All uploaded ✅`);
}

console.log(`\n=== URLs ===`);
for (const url of urls) {
  console.log(url);
}
