import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import path from "path";
import mime from "mime-types";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ---- .env.local loader (same as esy.com) ----
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
//   node scripts/r2-upload-clipart.mjs --file=./santa.png --category=christmas --name=santa-riding-sleigh
//   node scripts/r2-upload-clipart.mjs --file=./rose.png --category=flower --name=pink-rose-bouquet --dry
//   node scripts/r2-upload-clipart.mjs --file=./photo.jpg --category=cat --name=kitten-yarn --no-webp
//
// Args:
//   --file       (required) Path to the local image file
//   --category   (required) Target category (christmas, heart, halloween, flower, school, book, pumpkin, cat, thanksgiving, free)
//   --name       (optional) Custom slug for the image; defaults to original filename
//   --no-webp    (optional) Skip WebP conversion, keep original format
//   --max-width  (optional) Max width in px; defaults to 2048
//   --dry        (optional) Print upload plan without actually uploading

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.split("="))
    .map(([k, v]) => [k.replace(/^--/, ""), v ?? true]),
);

const filePath = args.file;
const category = slugify(String(args.category || ""));
const baseName = slugify(String(args.name || path.parse(filePath || "").name));
const dryRun = args.dry === true || args.dry === "true";
const noWebp = args["no-webp"] === true || args["no-webp"] === "true";
const maxWidth = parseInt(args["max-width"] || "2048", 10);

if (!filePath || !category || !baseName) {
  console.error(
    `Missing args.\n\nUsage:\n  node scripts/r2-upload-clipart.mjs --file=./santa.png --category=christmas --name=santa-riding-sleigh\n\nRequired:\n  --file       Path to the local image file\n  --category   ${VALID_CATEGORIES.join(", ")}\n\nOptional:\n  --name       Custom slug (defaults to filename)\n  --no-webp    Skip WebP conversion\n  --max-width  Max width in px (default: 2048)\n  --dry        Dry run`,
  );
  process.exit(1);
}

if (!VALID_CATEGORIES.includes(category)) {
  console.error(
    `\n❌ Invalid category: "${category}"\n   Valid: ${VALID_CATEGORIES.join(", ")}`,
  );
  process.exit(1);
}

if (!existsSync(filePath)) {
  console.error(`\n❌ File not found: ${filePath}`);
  process.exit(1);
}

// ---- Image processing ----
const originalExt = path.extname(filePath).toLowerCase();
const skipConversion = [".svg", ".gif"].includes(originalExt);
const convertToWebp = !noWebp && !skipConversion;

let buf = readFileSync(filePath);
let ext = originalExt;
let contentType = mime.lookup(ext) || "application/octet-stream";

const originalMeta = skipConversion ? null : await sharp(buf).metadata();
const originalSize = buf.length;

// Resize if wider than maxWidth
if (!skipConversion && originalMeta && originalMeta.width > maxWidth) {
  buf = await sharp(buf).resize(maxWidth, null, { withoutEnlargement: true }).toBuffer();
  console.log(`\n📐 Resized: ${originalMeta.width}px → ${maxWidth}px width`);
}

// Convert to WebP
if (convertToWebp) {
  buf = await sharp(buf).webp({ quality: 85, effort: 6 }).toBuffer();
  ext = ".webp";
  contentType = "image/webp";
  const savings = ((1 - buf.length / originalSize) * 100).toFixed(0);
  console.log(
    `\n🔄 WebP: ${(originalSize / 1024).toFixed(0)}KB → ${(buf.length / 1024).toFixed(0)}KB (${savings}% smaller)`,
  );
}

const hash = hashBytes(buf, 10);
const key = `${category}/${baseName}.${hash}${ext}`;
const publicUrl = `${process.env.R2_PUBLIC_URL || "https://images.clip.art"}/${key}`;

console.log("\n=== R2 Upload Plan ===");
console.log("File:        ", filePath);
if (originalMeta) {
  console.log(
    "Original:    ",
    `${originalMeta.width}×${originalMeta.height}, ${(originalSize / 1024).toFixed(0)}KB`,
  );
}
console.log("Category:    ", category);
console.log("Slug:        ", baseName);
console.log("Format:      ", ext.replace(".", "").toUpperCase());
console.log("Size:        ", `${(buf.length / 1024).toFixed(0)}KB`);
console.log("Hash:        ", hash);
console.log("Key:         ", key);
console.log("URL:         ", publicUrl);

if (dryRun) {
  console.log("\n(dry run) Not uploading.");
  process.exit(0);
}

// ---- R2 upload ----
const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const bucket = process.env.R2_BUCKET_NAME;

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

await client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buf,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: {
      category,
      "original-filename": path.basename(filePath),
      "uploaded-at": new Date().toISOString(),
    },
  }),
);

console.log("\n✅ Uploaded:", publicUrl);
