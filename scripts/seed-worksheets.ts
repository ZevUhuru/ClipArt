/**
 * Internal script to batch-generate worksheet images.
 * Runs outside Next.js — uses the same libs directly.
 *
 * Modes (see docs/features/BATCH_MODE.md for the full architecture):
 *
 *   --mode sync      Default. Synchronous generation via images.generate().
 *                    Full price. Live per-image feedback. Good for smoke tests.
 *
 *   --mode batch     Plan + submit an OpenAI Batch API job (/v1/batches).
 *                    50% discount, 24h SLA. Writes state to .batches/<name>/.
 *                    Use --batch-name to pick the folder name.
 *
 *   --mode poll      Check status of a previously-submitted batch.
 *
 *   --mode collect   Download results, convert to WEBP, upload to R2, insert
 *                    into Supabase. Idempotent (deterministic slugs).
 *
 * Common flags:
 *
 *   --topic <slug>         Restrict to one topic (e.g. 1st-grade--math--addition)
 *   --limit <n>            Cap worksheet_count per config
 *   --dry-run              Sync-mode only — print 5 composed prompts, no API calls
 *   --batch-name <name>    Label for .batches/<name>/ directory
 *   --prompts-file <path>  Bring your own JSONL of raw prompts (BYO batch)
 *
 * Examples:
 *
 *   npx tsx scripts/seed-worksheets.ts --dry-run
 *   npx tsx scripts/seed-worksheets.ts --mode sync --limit 2
 *   npx tsx scripts/seed-worksheets.ts --mode batch --batch-name full-2026-04-22
 *   npx tsx scripts/seed-worksheets.ts --mode poll --batch-name full-2026-04-22
 *   npx tsx scripts/seed-worksheets.ts --mode collect --batch-name full-2026-04-22
 *
 * Uses OpenAI gpt-image-2-2026-04-21 (ChatGPT Images 2.0, released 2026-04-21)
 * at 3:4 portrait. Pinned to the dated snapshot per the model-pinning rule
 * (.cursor/rules/model-pinning.mdc).
 *
 * See docs/features/WORKSHEETS.md, docs/features/BATCH_MODE.md, and
 * docs/features/CONTENT_GENERATION_SAFETY.md.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import OpenAI from "openai";

// ---------- types ----------

interface SafetyTheme {
  description?: string;
  required: string[];
  excluded: string[];
}

interface SafetyLibrary {
  global: { required: string[]; excluded: string[] };
  themes: Record<string, SafetyTheme>;
}

interface CharacterEntry {
  id: string;
  description: string;
}

interface CharacterLibrary {
  characters: CharacterEntry[];
}

interface TopicTheme {
  label: string;
  phrase: string;
  safety_ref: string | null;
}

interface SharedThemeEntry {
  phrase: string;
  safety_ref: string | null;
}

interface ThemesLibrary {
  themes: Record<string, SharedThemeEntry>;
}

// Theme entry in a topic config can be:
//   - a string (reference into _themes.json): "dinosaurs"
//   - a full object (legacy/override): { label, phrase, safety_ref }
//   - a ref with override: { id: "hiphop", phrase: "custom phrase" }
type TopicThemeRef =
  | string
  | TopicTheme
  | { id: string; phrase?: string; safety_ref?: string | null };

interface TopicConfig {
  grade: string;
  subject: string;
  topic: string;
  topic_label: string;
  worksheet_count: number;
  activity_templates: string[];
  themes: TopicThemeRef[];
}

// ---------- clients ----------

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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ---------- config ----------

const SEED_DIR = path.join(process.cwd(), "scripts", "seed-worksheets");
// Parallelism doesn't change per-image cost, only throughput. Ceiling is the
// OpenAI rate-limit tier (images-per-minute). 8 is safe for tier ≥2; bump
// higher if you're on tier 4/5 and see no 429s. Batch API (--mode batch) is
// still the right choice for runs of >100 images (50% cheaper).
const CONCURRENCY = 8;
const SKIP_EXISTING = true;

// ---------- load libraries ----------

function loadJson<T>(relativePath: string): T {
  const abs = path.join(SEED_DIR, relativePath);
  const raw = fs.readFileSync(abs, "utf-8");
  return JSON.parse(raw) as T;
}

function loadAllConfigs(): TopicConfig[] {
  const configsDir = path.join(SEED_DIR, "configs");
  if (!fs.existsSync(configsDir)) return [];
  const files = fs.readdirSync(configsDir).filter((f) => f.endsWith(".json"));
  return files.map((f) => loadJson<TopicConfig>(`configs/${f}`));
}

function resolveTheme(
  ref: TopicThemeRef,
  themesLib: ThemesLibrary,
): TopicTheme {
  // Full legacy object: { label, phrase, safety_ref }
  if (typeof ref === "object" && "label" in ref && "phrase" in ref) {
    return ref as TopicTheme;
  }

  // Id-with-override: { id, phrase?, safety_ref? }
  if (typeof ref === "object" && "id" in ref) {
    const id = ref.id;
    const base = themesLib.themes[id];
    if (!base) {
      throw new Error(`Unknown shared theme id: "${id}"`);
    }
    return {
      label: id,
      phrase: ref.phrase ?? base.phrase,
      safety_ref:
        ref.safety_ref !== undefined ? ref.safety_ref : base.safety_ref,
    };
  }

  // Plain string ref
  if (typeof ref === "string") {
    const base = themesLib.themes[ref];
    if (!base) {
      throw new Error(`Unknown shared theme id: "${ref}"`);
    }
    return { label: ref, phrase: base.phrase, safety_ref: base.safety_ref };
  }

  throw new Error(`Invalid theme ref: ${JSON.stringify(ref)}`);
}

function resolveThemes(
  config: TopicConfig,
  themesLib: ThemesLibrary,
): TopicTheme[] {
  return config.themes.map((t) => resolveTheme(t, themesLib));
}

// ---------- prompt composition ----------

function composePrompt(args: {
  template: string;
  character: CharacterEntry;
  theme: TopicTheme;
  topicLabel: string;
  safety: SafetyLibrary;
}): { prompt: string; excluded: string[] } {
  const { template, character, theme, topicLabel, safety } = args;

  const topicLabelUpper = topicLabel.toUpperCase();

  const expand = (s: string): string =>
    s
      .replaceAll("{{character}}", character.description)
      .replaceAll("{{topic_label_upper}}", topicLabelUpper)
      .replaceAll("{{topic_label}}", topicLabel)
      .replaceAll("{{topic}}", topicLabel);

  const activity = expand(template);
  const themed = `${activity} ${expand(theme.phrase)}`;

  const requiredList = [...safety.global.required];
  const excludedList = [...safety.global.excluded];

  if (theme.safety_ref && safety.themes[theme.safety_ref]) {
    const themeSafety = safety.themes[theme.safety_ref];
    requiredList.push(...themeSafety.required);
    excludedList.push(...themeSafety.excluded);
  }

  const layoutInstructions = [
    "Layout is a single printable worksheet page with 3:4 portrait aspect.",
    "Clear, large, easy-to-read text where numbers or letters appear.",
    "White or very light background, lots of whitespace for children to write.",
    "Never photorealistic — always cute cartoon style.",
  ].join(" ");

  const prompt = [
    themed,
    layoutInstructions,
    `REQUIRED: ${requiredList.join("; ")}.`,
    `DO NOT INCLUDE: ${excludedList.join("; ")}.`,
  ].join("\n\n");

  return { prompt, excluded: excludedList };
}

// ---------- generation ----------

// gpt-image-2 is the API model id for ChatGPT Images 2.0 (released
// 2026-04-21). The `chatgpt-image-latest` alias points at the OLDER model
// previously shipped in ChatGPT — OpenAI explicitly recommends `gpt-image-2`
// for API use. We pin the dated snapshot for batch reproducibility.
const IMAGE_MODEL = "gpt-image-2-2026-04-21";

async function generateImage(prompt: string): Promise<Buffer> {
  const response = await openai.images.generate({
    // Cast because some @openai/openai SDK versions haven't landed the
    // gpt-image-2 literal in their model union yet; the API accepts the
    // string regardless.
    model: IMAGE_MODEL as unknown as "gpt-image-1",
    prompt,
    size: "1024x1536",
    quality: "high",
    n: 1,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No image returned from ${IMAGE_MODEL}`);
  return Buffer.from(b64, "base64");
}

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

// ---------- job planner ----------

interface Job {
  index: number;
  config: TopicConfig;
  template: string;
  theme: TopicTheme;
  character: CharacterEntry;
  variationIdx: number;
}

function planJobs(
  configs: TopicConfig[],
  characters: CharacterEntry[],
  themesLib: ThemesLibrary,
): Job[] {
  const jobs: Job[] = [];
  let globalIdx = 0;

  for (const config of configs) {
    const resolvedThemes = resolveThemes(config, themesLib);
    if (resolvedThemes.length === 0) {
      throw new Error(
        `Topic ${config.grade}/${config.subject}/${config.topic} has no themes`,
      );
    }

    const count = config.worksheet_count;
    for (let i = 0; i < count; i++) {
      const template =
        config.activity_templates[i % config.activity_templates.length];
      const theme = resolvedThemes[i % resolvedThemes.length];
      const character = characters[(i + globalIdx) % characters.length];
      jobs.push({
        index: ++globalIdx,
        config,
        template,
        theme,
        character,
        variationIdx: i,
      });
    }
  }

  return jobs;
}

// ---------- shared helpers (used by both sync and batch paths) ----------

// Deterministic slug: (grade, subject, topic, theme, character, variationIdx)
// is a unique tuple inside the batch plan. No random suffix, so if the batch
// crashes or we re-run, SKIP_EXISTING actually skips already-completed rows
// instead of regenerating duplicates.
function slugForJob(job: Job): string {
  const { config, theme, character, variationIdx } = job;
  return `${config.grade}-${config.subject}-${config.topic}-${theme.label}-${character.id}-${variationIdx}`;
}

function r2KeyForSlug(
  grade: string,
  subject: string,
  topic: string,
  slug: string,
): string {
  return `worksheets/${grade}/${subject}/${topic}/${slug}.webp`;
}

async function existingSlugsFor(topic: string): Promise<Set<string>> {
  if (!SKIP_EXISTING) return new Set();
  const { data } = await supabase
    .from("generations")
    .select("slug")
    .eq("content_type", "worksheet")
    .eq("topic", topic);
  return new Set((data || []).map((r: { slug: string }) => r.slug));
}

async function persistGeneratedImage(opts: {
  rawBuffer: Buffer;
  prompt: string;
  slug: string;
  r2Key: string;
  grade: string;
  subject: string;
  topic: string;
  topicLabel: string;
  themeLabel: string;
}): Promise<void> {
  const webpBuffer = await sharp(opts.rawBuffer)
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  const imageUrl = await uploadToR2(webpBuffer, opts.r2Key);

  const title = `${opts.topicLabel} Worksheet — ${opts.themeLabel.replace(/-/g, " ")}`;
  const description = `Free printable ${opts.topicLabel.toLowerCase()} worksheet for ${opts.grade.replace("-", " ")} featuring a ${opts.themeLabel.replace(/-/g, " ")} theme. Cute cartoon illustrations, kid-safe, ready to print.`;

  await supabase.from("generations").insert({
    user_id: null,
    prompt: opts.prompt,
    style: "cartoon",
    content_type: "worksheet",
    image_url: imageUrl,
    category: opts.topic,
    is_public: true,
    title,
    slug: opts.slug,
    description,
    aspect_ratio: "3:4",
    model: IMAGE_MODEL,
    grade: opts.grade,
    subject: opts.subject,
    topic: opts.topic,
  });
}

// ---------- sync worker ----------

async function processOne(
  job: Job,
  safety: SafetyLibrary,
  existing: Set<string>,
): Promise<boolean> {
  const { config, template, theme, character } = job;

  const { prompt } = composePrompt({
    template,
    character,
    theme,
    topicLabel: config.topic_label,
    safety,
  });

  const uniqueSlug = slugForJob(job);

  if (existing.has(uniqueSlug)) {
    console.log(`  [${job.index}] ↷ skip (already exists) — ${uniqueSlug}`);
    return false;
  }

  const r2Key = r2KeyForSlug(
    config.grade,
    config.subject,
    config.topic,
    uniqueSlug,
  );

  try {
    const rawBuffer = await generateImage(prompt);
    await persistGeneratedImage({
      rawBuffer,
      prompt,
      slug: uniqueSlug,
      r2Key,
      grade: config.grade,
      subject: config.subject,
      topic: config.topic,
      topicLabel: config.topic_label,
      themeLabel: theme.label,
    });

    console.log(
      `  [${job.index}] ✓ ${config.grade}/${config.subject}/${config.topic} — ${theme.label} (${character.id})`,
    );
    return true;
  } catch (err) {
    console.error(
      `  [${job.index}] ✗ ${config.grade}/${config.subject}/${config.topic} — ${theme.label}: ${(err as Error).message}`,
    );
    return false;
  }
}

async function runPool(
  jobs: Job[],
  safety: SafetyLibrary,
  existingByTopic: Map<string, Set<string>>,
  concurrency: number,
): Promise<{ ok: number; fail: number }> {
  let ok = 0;
  let fail = 0;
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= jobs.length) return;
      const job = jobs[idx];
      const existing = existingByTopic.get(job.config.topic) || new Set();
      const success = await processOne(job, safety, existing);
      if (success) ok++;
      else fail++;
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, jobs.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return { ok, fail };
}

// ---------- batch mode ----------
//
// Thin wrapper around OpenAI Batch API (/v1/batches). See
// docs/features/BATCH_MODE.md for the architecture and command reference.
//
// Directory layout:
//   .batches/<name>/
//     requests.jsonl     — what we upload (one OpenAI request per line)
//     meta.json          — custom_id → { slug, r2Key, grade, subject, topic, ... }
//                          for the collect phase
//     submission.json    — { batch_id, input_file_id, submitted_at }
//     results.jsonl      — downloaded output (present after collect starts)
//
// .batches/ is gitignored.

interface BatchJobMeta {
  customId: string;
  slug: string;
  r2Key: string;
  grade: string;
  subject: string;
  topic: string;
  topicLabel: string;
  themeLabel: string;
  prompt: string;
}

interface BatchMetaFile {
  name: string;
  model: string;
  created_at: string;
  jobs: BatchJobMeta[];
}

interface BatchSubmissionFile {
  name: string;
  batch_id: string;
  input_file_id: string;
  submitted_at: string;
  request_count: number;
}

const BATCHES_ROOT = path.join(__dirname, "..", ".batches");

function batchDir(name: string): string {
  return path.join(BATCHES_ROOT, name);
}

function ensureBatchDir(name: string): string {
  const dir = batchDir(name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function customIdFor(slug: string): string {
  // OpenAI batch custom_id: 1-64 chars, alphanumerics + `_`-`.`.
  // Our slugs already fit that shape (only alphanumerics and dashes).
  return slug;
}

function buildBatchRequest(customId: string, prompt: string): unknown {
  return {
    custom_id: customId,
    method: "POST",
    url: "/v1/images/generations",
    body: {
      model: IMAGE_MODEL,
      prompt,
      size: "1024x1536",
      quality: "high",
      n: 1,
    },
  };
}

async function planAndSubmitBatch(opts: {
  name: string;
  configs: TopicConfig[];
  characters: CharacterEntry[];
  themesLib: ThemesLibrary;
  safety: SafetyLibrary;
  existingByTopic: Map<string, Set<string>>;
}): Promise<void> {
  const dir = ensureBatchDir(opts.name);
  const allJobs = planJobs(opts.configs, opts.characters, opts.themesLib);

  const requests: string[] = [];
  const metaJobs: BatchJobMeta[] = [];
  let skipped = 0;

  for (const job of allJobs) {
    const slug = slugForJob(job);
    const existing = opts.existingByTopic.get(job.config.topic) || new Set();
    if (existing.has(slug)) {
      skipped++;
      continue;
    }

    const { prompt } = composePrompt({
      template: job.template,
      character: job.character,
      theme: job.theme,
      topicLabel: job.config.topic_label,
      safety: opts.safety,
    });

    const r2Key = r2KeyForSlug(
      job.config.grade,
      job.config.subject,
      job.config.topic,
      slug,
    );
    const customId = customIdFor(slug);

    requests.push(JSON.stringify(buildBatchRequest(customId, prompt)));
    metaJobs.push({
      customId,
      slug,
      r2Key,
      grade: job.config.grade,
      subject: job.config.subject,
      topic: job.config.topic,
      topicLabel: job.config.topic_label,
      themeLabel: job.theme.label,
      prompt,
    });
  }

  if (requests.length === 0) {
    console.log(
      `No pending jobs for batch "${opts.name}" (${skipped} already exist). Nothing to submit.`,
    );
    return;
  }

  const requestsPath = path.join(dir, "requests.jsonl");
  fs.writeFileSync(requestsPath, requests.join("\n") + "\n");

  const metaPath = path.join(dir, "meta.json");
  const meta: BatchMetaFile = {
    name: opts.name,
    model: IMAGE_MODEL,
    created_at: new Date().toISOString(),
    jobs: metaJobs,
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  console.log(
    `Batch "${opts.name}": ${requests.length} requests prepared (${skipped} skipped as already-existing).`,
  );
  console.log(`  requests: ${requestsPath}`);
  console.log(`  meta:     ${metaPath}`);

  console.log("\nUploading input file to OpenAI…");
  const file = await openai.files.create({
    file: fs.createReadStream(requestsPath),
    purpose: "batch",
  });
  console.log(`  input_file_id: ${file.id}`);

  console.log("Creating batch job…");
  const batch = await openai.batches.create({
    input_file_id: file.id,
    endpoint: "/v1/images/generations" as "/v1/chat/completions",
    completion_window: "24h",
    metadata: {
      source: "clip.art/seed-worksheets",
      batch_name: opts.name,
    },
  });
  console.log(`  batch_id: ${batch.id}  status: ${batch.status}`);

  const submission: BatchSubmissionFile = {
    name: opts.name,
    batch_id: batch.id,
    input_file_id: file.id,
    submitted_at: new Date().toISOString(),
    request_count: requests.length,
  };
  fs.writeFileSync(
    path.join(dir, "submission.json"),
    JSON.stringify(submission, null, 2),
  );

  console.log(`\nBatch submitted. Poll with:`);
  console.log(`  npx tsx scripts/seed-worksheets.ts --mode poll --batch-name ${opts.name}`);
}

function readSubmission(name: string): BatchSubmissionFile {
  const p = path.join(batchDir(name), "submission.json");
  if (!fs.existsSync(p)) {
    throw new Error(`No submission found for batch "${name}". Expected ${p}.`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function readBatchMeta(name: string): BatchMetaFile {
  const p = path.join(batchDir(name), "meta.json");
  if (!fs.existsSync(p)) {
    throw new Error(`No meta.json for batch "${name}". Expected ${p}.`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function pollBatch(name: string): Promise<void> {
  const sub = readSubmission(name);
  const batch = await openai.batches.retrieve(sub.batch_id);
  console.log(`Batch "${name}" (${sub.batch_id})`);
  console.log(`  status:   ${batch.status}`);
  if (batch.request_counts) {
    console.log(
      `  counts:   total=${batch.request_counts.total} completed=${batch.request_counts.completed} failed=${batch.request_counts.failed}`,
    );
  }
  console.log(`  created:  ${new Date(batch.created_at * 1000).toISOString()}`);
  if (batch.expires_at) {
    console.log(
      `  expires:  ${new Date(batch.expires_at * 1000).toISOString()}`,
    );
  }
  if (batch.output_file_id) {
    console.log(`  output_file_id: ${batch.output_file_id}`);
  }
  if (batch.error_file_id) {
    console.log(`  error_file_id:  ${batch.error_file_id}`);
  }

  if (batch.status === "completed") {
    console.log(`\nDone. Collect results with:`);
    console.log(
      `  npx tsx scripts/seed-worksheets.ts --mode collect --batch-name ${name}`,
    );
  } else if (
    batch.status === "failed" ||
    batch.status === "cancelled" ||
    batch.status === "expired"
  ) {
    console.log(`\nBatch ${batch.status}. Review error_file_id if present.`);
  } else {
    console.log(`\nNot done yet. Re-run --mode poll later.`);
  }
}

async function collectBatch(name: string): Promise<void> {
  const sub = readSubmission(name);
  const meta = readBatchMeta(name);
  const batch = await openai.batches.retrieve(sub.batch_id);

  if (batch.status !== "completed") {
    console.error(
      `Batch "${name}" is not completed (status=${batch.status}). Run --mode poll first.`,
    );
    process.exit(1);
  }
  if (!batch.output_file_id) {
    console.error(`Batch "${name}" has no output_file_id. Cannot collect.`);
    process.exit(1);
  }

  console.log(`Downloading output file ${batch.output_file_id}…`);
  const fileResponse = await openai.files.content(batch.output_file_id);
  const body = await fileResponse.text();
  const resultsPath = path.join(batchDir(name), "results.jsonl");
  fs.writeFileSync(resultsPath, body);
  console.log(`  saved: ${resultsPath}`);

  const metaByCustomId = new Map<string, BatchJobMeta>();
  for (const j of meta.jobs) metaByCustomId.set(j.customId, j);

  const existingByTopic = new Map<string, Set<string>>();
  for (const j of meta.jobs) {
    if (!existingByTopic.has(j.topic)) {
      existingByTopic.set(j.topic, await existingSlugsFor(j.topic));
    }
  }

  const lines = body.split("\n").filter((l) => l.trim().length > 0);
  console.log(
    `\nProcessing ${lines.length} result lines (against ${meta.jobs.length} planned jobs)…`,
  );

  let ok = 0;
  let fail = 0;
  let skipped = 0;

  for (const line of lines) {
    let parsed: {
      custom_id: string;
      response?: {
        status_code: number;
        body?: { data?: Array<{ b64_json?: string }> };
      };
      error?: unknown;
    };
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      console.error(`  ✗ malformed JSONL line: ${(err as Error).message}`);
      fail++;
      continue;
    }

    const jobMeta = metaByCustomId.get(parsed.custom_id);
    if (!jobMeta) {
      console.error(
        `  ✗ ${parsed.custom_id}: no matching meta entry (ignored)`,
      );
      fail++;
      continue;
    }

    const existing = existingByTopic.get(jobMeta.topic) || new Set();
    if (existing.has(jobMeta.slug)) {
      console.log(`  ↷ skip (already exists) — ${jobMeta.slug}`);
      skipped++;
      continue;
    }

    if (
      parsed.error ||
      !parsed.response ||
      parsed.response.status_code >= 300
    ) {
      console.error(
        `  ✗ ${parsed.custom_id}: batch returned error (status ${parsed.response?.status_code ?? "n/a"})`,
      );
      fail++;
      continue;
    }

    const b64 = parsed.response.body?.data?.[0]?.b64_json;
    if (!b64) {
      console.error(`  ✗ ${parsed.custom_id}: no b64_json in response`);
      fail++;
      continue;
    }

    try {
      const rawBuffer = Buffer.from(b64, "base64");
      await persistGeneratedImage({
        rawBuffer,
        prompt: jobMeta.prompt,
        slug: jobMeta.slug,
        r2Key: jobMeta.r2Key,
        grade: jobMeta.grade,
        subject: jobMeta.subject,
        topic: jobMeta.topic,
        topicLabel: jobMeta.topicLabel,
        themeLabel: jobMeta.themeLabel,
      });
      existing.add(jobMeta.slug);
      console.log(
        `  ✓ ${jobMeta.grade}/${jobMeta.subject}/${jobMeta.topic} — ${jobMeta.themeLabel} (${jobMeta.slug})`,
      );
      ok++;
    } catch (err) {
      console.error(
        `  ✗ ${jobMeta.slug}: persist failed — ${(err as Error).message}`,
      );
      fail++;
    }
  }

  if (batch.error_file_id) {
    console.log(
      `\nBatch has error_file_id=${batch.error_file_id}; fetch separately to inspect partial failures.`,
    );
  }

  console.log(
    `\nCollect complete: ${ok} ingested, ${skipped} already existed, ${fail} failed.`,
  );
}

// ---------- main ----------

type Mode = "sync" | "batch" | "poll" | "collect";

interface CliOpts {
  mode: Mode;
  topic?: string;
  limit?: number;
  dryRun: boolean;
  batchName?: string;
  promptsFile?: string;
}

function parseArgs(): CliOpts {
  const args = process.argv.slice(2);
  const opts: CliOpts = { mode: "sync", dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--topic") opts.topic = args[++i];
    else if (a === "--limit") opts.limit = Number(args[++i]);
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--mode") {
      const m = args[++i] as Mode;
      if (!["sync", "batch", "poll", "collect"].includes(m)) {
        console.error(`Invalid --mode ${m}. Use sync|batch|poll|collect.`);
        process.exit(1);
      }
      opts.mode = m;
    } else if (a === "--batch-name") opts.batchName = args[++i];
    else if (a === "--prompts-file") opts.promptsFile = args[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs();

  if (opts.mode === "poll") {
    if (!opts.batchName) {
      console.error("--mode poll requires --batch-name");
      process.exit(1);
    }
    await pollBatch(opts.batchName);
    return;
  }

  if (opts.mode === "collect") {
    if (!opts.batchName) {
      console.error("--mode collect requires --batch-name");
      process.exit(1);
    }
    await collectBatch(opts.batchName);
    return;
  }

  const safety = loadJson<SafetyLibrary>("_safety.json");
  const characterLib = loadJson<CharacterLibrary>("_characters.json");
  const themesLib = loadJson<ThemesLibrary>("_themes.json");
  let configs = loadAllConfigs();

  if (opts.topic) {
    configs = configs.filter((c) => {
      const slug = `${c.grade}--${c.subject}--${c.topic}`;
      return slug === opts.topic;
    });
    if (configs.length === 0) {
      console.error(`No config matches --topic ${opts.topic}`);
      process.exit(1);
    }
  }

  if (opts.limit) {
    configs = configs.map((c) => ({
      ...c,
      worksheet_count: Math.min(c.worksheet_count, opts.limit!),
    }));
  }

  const allJobs = planJobs(configs, characterLib.characters, themesLib);
  console.log(
    `Planned ${allJobs.length} worksheet generations across ${configs.length} topic(s).`,
  );

  if (opts.dryRun) {
    for (const j of allJobs.slice(0, 5)) {
      const { prompt } = composePrompt({
        template: j.template,
        character: j.character,
        theme: j.theme,
        topicLabel: j.config.topic_label,
        safety,
      });
      console.log("\n---");
      console.log(
        `[${j.index}] ${j.config.grade}/${j.config.subject}/${j.config.topic} — ${j.theme.label} / ${j.character.id}`,
      );
      console.log(prompt);
    }
    console.log(
      `\n(Dry run: showed first 5 of ${allJobs.length} prompts. No images generated.)`,
    );
    return;
  }

  const existingByTopic = new Map<string, Set<string>>();
  for (const c of configs) {
    existingByTopic.set(c.topic, await existingSlugsFor(c.topic));
  }

  if (opts.mode === "batch") {
    const name =
      opts.batchName ??
      `worksheets-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    await planAndSubmitBatch({
      name,
      configs,
      characters: characterLib.characters,
      themesLib,
      safety,
      existingByTopic,
    });
    return;
  }

  const { ok, fail } = await runPool(
    allJobs,
    safety,
    existingByTopic,
    CONCURRENCY,
  );
  console.log(`\nDone! Generated: ${ok}, Failed: ${fail}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
