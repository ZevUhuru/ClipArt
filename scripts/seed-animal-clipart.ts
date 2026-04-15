/**
 * Internal script to batch-generate clip art for animal alphabet pages.
 * Runs outside Next.js — uses the same libs directly.
 *
 * Usage:  npx tsx scripts/seed-animal-clipart.ts
 *
 * Generates ~2 images per animal across varied styles (no illustrations).
 * Adjust IMAGES_PER_ANIMAL and CONCURRENCY as needed.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// ---------- inline helpers (avoid Next.js-only imports) ----------

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME || "clip-art-images";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://images.clip.art";

async function uploadToR2(buffer: Buffer, key: string): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${PUBLIC_URL}/${key}`;
}

// ---------- image generation (Gemini + GPT Image 1) ----------

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type ModelChoice = "gemini" | "chatgpt-image-latest";

const STYLE_DESCRIPTORS: Record<string, string> = {
  flat: "flat vector, bold outlines, clean shapes, solid colors",
  cartoon: "cartoon style, bold colors, expressive, friendly",
  watercolor: "watercolor painting, soft edges, paint splashes, delicate brushstrokes, vibrant tones",
  vintage: "vintage retro, muted colors, textured, nostalgic style",
  "3d": "3D rendered, soft lighting, smooth materials, clean render",
  doodle: "hand-drawn doodle, sketchy lines, playful, casual ink style",
  kawaii: "kawaii style, super cute, pastel colors, rounded shapes, happy expression",
  outline: "minimal outline, thin clean lines, monochrome",
  sticker: "sticker style, thick outline, vibrant colors, cute",
  chibi: "chibi anime, cute big head small body, bold outlines, colorful",
  pixel: "pixel art, retro 8-bit, clean pixels, no anti-aliasing",
};

const CLIP_ART_STYLES = Object.keys(STYLE_DESCRIPTORS);

const PROMPT_VARIATIONS = [
  (animal: string) => `cute ${animal} smiling and waving`,
  (animal: string) => `${animal} sitting, full body view`,
  (animal: string) => `happy ${animal} walking`,
  (animal: string) => `baby ${animal}, adorable and round`,
  (animal: string) => `${animal} in a playful pose`,
  (animal: string) => `${animal} face close-up portrait`,
  (animal: string) => `${animal} leaping through the air`,
  (animal: string) => `cute ${animal} sleeping peacefully`,
  (animal: string) => `${animal} eating its favorite food`,
  (animal: string) => `mother ${animal} with baby`,
  (animal: string) => `majestic ${animal} standing proudly`,
  (animal: string) => `funny ${animal} with a surprised expression`,
  (animal: string) => `${animal} running at full speed`,
  (animal: string) => `${animal} peeking out curiously`,
  (animal: string) => `${animal} family group together`,
  (animal: string) => `adorable ${animal} wearing a party hat`,
  (animal: string) => `${animal} in its natural habitat`,
  (animal: string) => `realistic ${animal} side profile view`,
  (animal: string) => `${animal} stretching and yawning`,
  (animal: string) => `tiny ${animal} sitting on a leaf`,
  (animal: string) => `${animal} howling or calling out`,
  (animal: string) => `${animal} looking directly at viewer`,
];

function buildPrompt(animal: string, style: string, variationIdx: number): string {
  const descriptor = STYLE_DESCRIPTORS[style] || STYLE_DESCRIPTORS.flat;
  const variation = PROMPT_VARIATIONS[variationIdx % PROMPT_VARIATIONS.length];
  return `${variation(animal)}. ${descriptor}. clip art, isolated object on plain white background`;
}

async function generateWithGemini(prompt: string): Promise<Buffer> {
  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "1:1" },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (!part || !("inlineData" in part) || !part.inlineData?.data) {
    throw new Error("No image returned from Gemini");
  }
  return Buffer.from(part.inlineData.data, "base64");
}

async function generateWithGPT(prompt: string): Promise<Buffer> {
  const response = await openai.images.generate({
    model: "chatgpt-image-latest",
    prompt,
    size: "1024x1024",
    quality: "high",
    n: 1,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from chatgpt-image-latest");
  return Buffer.from(b64, "base64");
}

async function generateClipArt(prompt: string, model: ModelChoice): Promise<Buffer> {
  if (model === "chatgpt-image-latest") return generateWithGPT(prompt);
  return generateWithGemini(prompt);
}

// ---------- config ----------

const IMAGES_PER_ANIMAL = 2;
const GEMINI_CONCURRENCY = 5;
const OPENAI_CONCURRENCY = 3;
const SKIP_EXISTING = true;

// ---------- main ----------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface AnimalRow {
  name: string;
  letter: string;
  slug: string;
}

interface Job {
  animal: AnimalRow;
  style: string;
  model: ModelChoice;
  variationIdx: number;
  index: number;
}

async function generateOneImage(job: Job): Promise<boolean> {
  const { animal, style, model, variationIdx, index } = job;
  const prompt = buildPrompt(animal.name.toLowerCase(), style, variationIdx);

  try {
    const rawBuffer = await generateClipArt(prompt, model);
    const webpBuffer = await sharp(rawBuffer)
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    const suffix = Math.random().toString(36).slice(2, 8);
    const categorySlug = `animals-that-start-with-${animal.letter.toLowerCase()}`;
    const uniqueSlug = `${animal.slug}-${style}-${suffix}`;
    const key = `${categorySlug}/${uniqueSlug}.webp`;
    const imageUrl = await uploadToR2(webpBuffer, key);

    const title = `${animal.name} ${style.charAt(0).toUpperCase() + style.slice(1)} Clip Art`;
    const dbModel = model === "chatgpt-image-latest" ? "dalle" : "gemini";

    await supabase.from("generations").insert({
      user_id: null,
      prompt,
      style,
      content_type: "clipart",
      image_url: imageUrl,
      category: categorySlug,
      is_public: true,
      title,
      slug: uniqueSlug,
      description: `Free ${animal.name.toLowerCase()} clip art in ${style} style`,
      aspect_ratio: "1:1",
      model: dbModel,
    });

    console.log(`  [${index}] ✓ ${animal.name} [${style}] (${model})`);
    return true;
  } catch (err) {
    console.error(`  [${index}] ✗ ${animal.name} [${style}] (${model}): ${(err as Error).message}`);
    return false;
  }
}

async function runPool(jobs: Job[], concurrency: number, label: string): Promise<{ ok: number; fail: number }> {
  let ok = 0;
  let fail = 0;
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= jobs.length) return;
      const success = await generateOneImage(jobs[idx]);
      if (success) ok++;
      else fail++;
    }
  }

  console.log(`\n⏩ Starting ${label} pool: ${jobs.length} jobs, concurrency ${concurrency}`);
  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, () => worker());
  await Promise.all(workers);
  return { ok, fail };
}

async function main() {
  const { data: animals, error } = await supabase
    .from("animal_entries")
    .select("name, letter, slug")
    .eq("is_active", true)
    .order("letter")
    .order("sort_order");

  if (error || !animals?.length) {
    console.error("Failed to fetch animals:", error?.message || "no rows");
    process.exit(1);
  }

  // Check which animals already have images (from partial previous runs)
  let existingSlugs = new Set<string>();
  if (SKIP_EXISTING) {
    const { data: existing } = await supabase
      .from("generations")
      .select("slug")
      .is("user_id", null)
      .eq("content_type", "clipart");
    if (existing) {
      existingSlugs = new Set(
        existing.map((r: { slug: string }) => r.slug.replace(/-[a-z0-9]{6}$/, "")),
      );
    }
    if (existingSlugs.size > 0) {
      console.log(`Skipping animals with existing images (found ${existingSlugs.size} existing slugs)`);
    }
  }

  // Build all jobs, split by model
  const geminiJobs: Job[] = [];
  const openaiJobs: Job[] = [];
  let jobIndex = 0;

  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i] as AnimalRow;

    for (let j = 0; j < IMAGES_PER_ANIMAL; j++) {
      const styleIdx = (i * IMAGES_PER_ANIMAL + j) % CLIP_ART_STYLES.length;
      const style = CLIP_ART_STYLES[styleIdx];
      const variationIdx = (i * 7 + j * 3) % PROMPT_VARIATIONS.length;
      const model: ModelChoice = j % 2 === 0 ? "gemini" : "chatgpt-image-latest";

      const slugPrefix = `${animal.slug}-${style}`;
      if (SKIP_EXISTING && existingSlugs.has(slugPrefix)) continue;

      const job: Job = { animal, style, model, variationIdx, index: ++jobIndex };
      if (model === "gemini") geminiJobs.push(job);
      else openaiJobs.push(job);
    }
  }

  const totalJobs = geminiJobs.length + openaiJobs.length;
  console.log(`\nFound ${animals.length} animals. ${totalJobs} images to generate (${geminiJobs.length} Gemini + ${openaiJobs.length} OpenAI).\n`);

  if (totalJobs === 0) {
    console.log("Nothing to do — all images already exist.");
    return;
  }

  // Run both pools in parallel — Gemini and OpenAI are independent APIs
  const [geminiResult, openaiResult] = await Promise.all([
    geminiJobs.length > 0
      ? runPool(geminiJobs, GEMINI_CONCURRENCY, "Gemini")
      : Promise.resolve({ ok: 0, fail: 0 }),
    openaiJobs.length > 0
      ? runPool(openaiJobs, OPENAI_CONCURRENCY, "OpenAI chatgpt-image-latest")
      : Promise.resolve({ ok: 0, fail: 0 }),
  ]);

  const totalOk = geminiResult.ok + openaiResult.ok;
  const totalFail = geminiResult.fail + openaiResult.fail;
  console.log(`\n✅ Done! Generated: ${totalOk}, Failed: ${totalFail}`);
  console.log(`   Gemini: ${geminiResult.ok}/${geminiJobs.length} | OpenAI: ${openaiResult.ok}/${openaiJobs.length}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
