/**
 * One-shot audit: how much have we spent on OpenAI image generation, and
 * would switching to gpt-image-1.5 have saved money?
 *
 * NOTE: Delete this script after the ESY migration. ESY owns cost tracking
 * post-Phase-3 (see docs/esy/04-migration-tracker.md).
 *
 * Usage:  npx tsx scripts/audit-openai-spend.ts
 *
 * Reads:
 *   - site_settings row `model_config` (current per-style routing)
 *   - generations table (historical rows, grouped by model + content_type)
 *
 * Pricing baked from platform.openai.com/docs/guides/image-generation
 * (verified 2026-04-21). We assume medium quality because that's the
 * default we pin in src/lib/gptImage1.ts and gptImage2.ts.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Medium-quality per-image prices, by content_type aspect.
// clipart → 1024x1024 (square)
// illustration → 1536x1024 (landscape)
// coloring → 1024x1536 (portrait)
type Aspect = "square" | "landscape" | "portrait";

const CT_ASPECT: Record<string, Aspect> = {
  clipart: "square",
  illustration: "landscape",
  coloring: "portrait",
};

const PRICING: Record<string, Record<Aspect, number>> = {
  "gpt-image-1":   { square: 0.042, landscape: 0.063, portrait: 0.063 },
  "gpt-image-1.5": { square: 0.034, landscape: 0.050, portrait: 0.050 },
  "gpt-image-2":   { square: 0.053, landscape: 0.041, portrait: 0.041 },
  gemini:          { square: 0.039, landscape: 0.039, portrait: 0.039 },
};

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function pad(s: string, n: number) {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

async function main() {
  console.log("\n=== clip.art OpenAI spend audit ===\n");

  // 1. Current routing config
  const { data: settings } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "model_config")
    .single();

  const config = (settings?.value ?? {}) as Record<string, string>;
  const distribution: Record<string, number> = {};
  for (const model of Object.values(config)) {
    distribution[model] = (distribution[model] ?? 0) + 1;
  }

  console.log("Current admin routing (from site_settings.model_config):");
  if (Object.keys(distribution).length === 0) {
    console.log("  (no override set — all styles fall through to STYLE_MODEL_MAP defaults = gemini)");
  } else {
    for (const [model, count] of Object.entries(distribution).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${pad(model, 18)} ${count} styles`);
    }
  }
  console.log("");

  // 2. Historical generations grouped by model + content_type.
  // Paginate manually because supabase-js caps a single response at 1000 rows.
  const PAGE = 1000;
  const counts = new Map<string, number>();
  let offset = 0;
  let fetched = 0;

  while (true) {
    const { data: rows, error } = await supabase
      .from("generations")
      .select("model, content_type")
      .range(offset, offset + PAGE - 1);

    if (error) {
      console.error("Failed to fetch generations:", error.message);
      process.exit(1);
    }

    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const model = row.model ?? "unknown";
      const ct = row.content_type ?? "clipart";
      const key = `${model}|${ct}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    fetched += rows.length;
    if (rows.length < PAGE) break;
    offset += PAGE;
  }

  console.log(`Historical generations in DB: ${fetched}\n`);

  console.log("Breakdown by model × content_type:");
  console.log(pad("  model", 22) + pad("content_type", 16) + pad("count", 10) + pad("est. spend", 14) + "if gpt-image-1.5");
  console.log("  " + "-".repeat(78));

  let totalActual = 0;
  let totalHypothetical15 = 0;
  const modelTotals = new Map<string, number>();

  for (const [key, count] of Array.from(counts.entries()).sort((a, b) => b[1] - a[1])) {
    const [model, ct] = key.split("|");
    const aspect = CT_ASPECT[ct] ?? "square";
    const priceActual = PRICING[model]?.[aspect];
    const price15 = PRICING["gpt-image-1.5"][aspect];

    const actualSpend = priceActual != null ? count * priceActual : 0;
    const hypotheticalSpend = count * price15;

    totalActual += actualSpend;
    if (model === "gpt-image-1") totalHypothetical15 += hypotheticalSpend;
    else totalHypothetical15 += actualSpend;

    modelTotals.set(model, (modelTotals.get(model) ?? 0) + actualSpend);

    const spendStr = priceActual != null ? fmt(actualSpend) : "— (unknown price)";
    const hypoStr = model === "gpt-image-1" ? fmt(hypotheticalSpend) : "same";

    console.log(
      "  " + pad(model, 20) + pad(ct, 16) + pad(String(count), 10) + pad(spendStr, 14) + hypoStr,
    );
  }

  console.log("");
  console.log("Estimated historical spend, by model:");
  for (const [model, spend] of Array.from(modelTotals.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${pad(model, 20)} ${fmt(spend)}`);
  }

  const overpayment = totalActual - totalHypothetical15;
  console.log("\n=== Bottom line ===");
  console.log(`Actual estimated spend:                 ${fmt(totalActual)}`);
  console.log(`If gpt-image-1 rows had run on 1.5:     ${fmt(totalHypothetical15)}`);
  console.log(
    `Overpayment from not upgrading to 1.5:  ${fmt(overpayment)} ` +
      (overpayment > 0 ? "(money we could've saved)" : "(no overpayment — model was never used)"),
  );
  console.log("\nAssumptions:");
  console.log("  - Medium quality (matches src/lib/gptImage1.ts & gptImage2.ts)");
  console.log("  - Aspect derived from content_type (clipart=1:1, illustration=4:3, coloring=3:4)");
  console.log("  - Gemini and gpt-image-2 rows unaffected — only gpt-image-1 rows would have moved");
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
