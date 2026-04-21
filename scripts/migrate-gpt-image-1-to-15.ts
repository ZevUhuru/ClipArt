/**
 * One-shot migration: move any style currently routed to `gpt-image-1` over
 * to `gpt-image-1.5` in the admin model_config. Safe to re-run.
 *
 * Usage:  npx tsx scripts/migrate-gpt-image-1-to-15.ts [--dry-run]
 *
 * Does NOT touch historical generations rows — those stay labelled with the
 * model that actually produced them for accurate provenance.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data: row, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "model_config")
    .single();

  if (error || !row) {
    console.error("No model_config row found:", error?.message);
    process.exit(1);
  }

  const current = (row.value ?? {}) as Record<string, string>;
  const next: Record<string, string> = {};
  const changes: string[] = [];

  for (const [style, model] of Object.entries(current)) {
    if (model === "gpt-image-1") {
      next[style] = "gpt-image-1.5";
      changes.push(`  ${style}: gpt-image-1 → gpt-image-1.5`);
    } else {
      next[style] = model;
    }
  }

  console.log(`Found ${changes.length} styles to migrate:\n${changes.join("\n") || "  (none)"}`);

  if (changes.length === 0) {
    console.log("\nNothing to do.");
    return;
  }

  if (dryRun) {
    console.log("\n--dry-run specified, not writing.");
    return;
  }

  const { error: upsertError } = await supabase
    .from("site_settings")
    .upsert({
      key: "model_config",
      value: next,
      updated_at: new Date().toISOString(),
    });

  if (upsertError) {
    console.error("Upsert failed:", upsertError.message);
    process.exit(1);
  }

  console.log("\n✓ model_config updated. Cache will refresh within 60s.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
