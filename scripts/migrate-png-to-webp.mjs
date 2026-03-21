#!/usr/bin/env node

/**
 * One-time migration: fetch all PNG generations from R2,
 * convert to WebP via Sharp, upload WebP copy, update DB URL,
 * then delete the old PNG object.
 *
 * Usage: node scripts/migrate-png-to-webp.mjs [--dry]
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx);
  const val = trimmed.slice(idx + 1);
  if (!process.env[key]) process.env[key] = val;
}
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry");

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || "clip-art-images";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://images.clip.art";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function migrate() {
  const { data: rows, error } = await supabase
    .from("generations")
    .select("id, image_url")
    .like("image_url", "%.png");

  if (error) {
    console.error("DB query failed:", error);
    process.exit(1);
  }

  console.log(`Found ${rows.length} PNG generations to migrate${DRY_RUN ? " (DRY RUN)" : ""}\n`);

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    const pngUrl = row.image_url;
    const pngKey = pngUrl.replace(`${PUBLIC_URL}/`, "");
    const webpKey = pngKey.replace(/\.png$/, ".webp");
    const webpUrl = `${PUBLIC_URL}/${webpKey}`;

    process.stdout.write(`[${success + failed + 1}/${rows.length}] ${pngKey} → ${webpKey} ... `);

    if (DRY_RUN) {
      console.log("SKIP (dry run)");
      success++;
      continue;
    }

    try {
      const res = await fetch(pngUrl);
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);

      const pngBuffer = Buffer.from(await res.arrayBuffer());
      const webpBuffer = await sharp(pngBuffer).webp({ quality: 85, effort: 4 }).toBuffer();

      const savings = ((1 - webpBuffer.length / pngBuffer.length) * 100).toFixed(1);

      await r2.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: webpKey,
          Body: webpBuffer,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );

      const { error: updateErr } = await supabase
        .from("generations")
        .update({ image_url: webpUrl })
        .eq("id", row.id);

      if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

      await r2.send(
        new DeleteObjectCommand({ Bucket: BUCKET, Key: pngKey }),
      );

      console.log(`OK (${(pngBuffer.length / 1024).toFixed(0)}KB → ${(webpBuffer.length / 1024).toFixed(0)}KB, -${savings}%)`);
      success++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} converted, ${failed} failed`);
}

migrate();
