import { createSupabaseAdmin } from "@/lib/supabase/server";
import { generateText } from "@/lib/textAI";
import * as Sentry from "@sentry/nextjs";
import type { ContentType } from "./styles";

export interface Classification {
  title: string;
  category: string;
  description: string;
  slug: string;
}

async function getCategorySlugs(): Promise<string[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("slug")
      .eq("is_active", true)
      .in("type", ["clipart"])
      .order("sort_order");
    return (data || []).map((r: { slug: string }) => r.slug);
  } catch {
    return ["christmas", "heart", "halloween", "free", "flower", "school", "book", "pumpkin", "cat", "thanksgiving"];
  }
}

async function getColoringThemeSlugs(): Promise<string[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("slug")
      .eq("is_active", true)
      .eq("type", "coloring")
      .order("sort_order");
    return (data || []).map((r: { slug: string }) => r.slug);
  } catch {
    return ["mandala", "unicorn", "dinosaur", "animals", "princess", "mermaid", "ocean", "space", "farm", "coloring-free"];
  }
}

async function getIllustrationCategorySlugs(): Promise<string[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("categories")
      .select("slug")
      .eq("is_active", true)
      .eq("type", "illustration")
      .order("sort_order");
    return (data || []).map((r: { slug: string }) => r.slug);
  } catch {
    return [
      "fantasy-scenes", "nature-landscapes", "urban-scenes", "characters",
      "animals-scenes", "food-kitchen", "seasonal", "storybook-scenes",
      "abstract-art", "illustration-free",
    ];
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function cleanTitleFromPrompt(prompt: string): string {
  const words = prompt
    .replace(/[-_]+/g, " ")
    .replace(/[,;:."']+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 8);
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function looksLikePrompt(title: string, prompt: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm(title) === norm(prompt)) return true;
  if (norm(title) === norm(prompt.slice(0, 80))) return true;
  if (title.includes(",") && title.length > 50) return true;
  return false;
}

function resolveContentType(style: string, contentType?: ContentType): ContentType {
  if (contentType) return contentType;
  if (style === "coloring") return "coloring";
  return "clipart";
}

export async function classifyPrompt(
  prompt: string,
  style: string,
  contentType?: ContentType,
): Promise<Classification> {
  const ct = resolveContentType(style, contentType);
  const fallbackCategory = ct === "coloring" ? "coloring-free" : ct === "illustration" ? "illustration-free" : "free";

  const fallback: Classification = {
    title: cleanTitleFromPrompt(prompt),
    category: fallbackCategory,
    description: prompt,
    slug: slugify(cleanTitleFromPrompt(prompt)),
  };

  try {
    let categorySlugs: string[];
    let systemPrompt: string;

    if (ct === "coloring") {
      categorySlugs = await getColoringThemeSlugs();
      systemPrompt = `You are a coloring page classifier. Given a user's coloring page generation prompt, return a JSON object with:
- "title": A concise 3-8 word name for the main subject (max 60 chars). Properly capitalized. Fix typos. Do NOT repeat the prompt verbatim. Do NOT include commas. Do NOT include "coloring page".
- "category": The best matching theme slug from this list: ${JSON.stringify(categorySlugs)}. If none fit well, use "coloring-free".
- "description": A human-readable SEO sentence (100-160 chars). Describe the image and suggest use cases (e.g. "for classroom activities, party decorations, or quiet time"). Do NOT just repeat the prompt.
- "slug": A URL-friendly slug derived from the title (lowercase, hyphens, no special chars, max 40 chars).

Return ONLY valid JSON, no markdown fences, no explanation.`;
    } else if (ct === "illustration") {
      categorySlugs = await getIllustrationCategorySlugs();
      systemPrompt = `You are an illustration classifier. Given a user's illustration generation prompt, return a JSON object with:
- "title": A concise 3-8 word name for the main subject (max 60 chars). Properly capitalized. Fix typos. Do NOT repeat the prompt verbatim. Do NOT include commas. Do NOT include "illustration".
- "category": The best matching category slug from this list: ${JSON.stringify(categorySlugs)}. If none fit well, use "illustration-free".
- "description": A human-readable SEO sentence (100-160 chars). Describe the scene and suggest use cases (e.g. "for presentations, book covers, or wall art"). Do NOT just repeat the prompt.
- "slug": A URL-friendly slug derived from the title (lowercase, hyphens, no special chars, max 40 chars).

Return ONLY valid JSON, no markdown fences, no explanation.`;
    } else {
      categorySlugs = await getCategorySlugs();
      systemPrompt = `You are a clip art classifier. Given a user's image generation prompt, return a JSON object with:
- "title": A concise 3-8 word name for the main subject (max 60 chars). Properly capitalized. Fix typos. Do NOT repeat the prompt verbatim. Do NOT include commas. Do NOT include "clip art".
- "category": The best matching category slug from this list: ${JSON.stringify(categorySlugs)}. If none fit well, use "free".
- "description": A human-readable SEO sentence (100-160 chars). Describe the image and suggest use cases (e.g. "for school projects, presentations, or crafts"). Do NOT just repeat the prompt.
- "slug": A URL-friendly slug derived from the title (lowercase, hyphens, no special chars, max 40 chars).

Return ONLY valid JSON, no markdown fences, no explanation.`;
    }

    const rawText = await generateText(
      "classification",
      systemPrompt,
      `Prompt: "${prompt}"\nStyle: ${style}`,
      { temperature: 0.1 },
    );

    const cleaned = rawText.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const rawTitle = typeof parsed.title === "string" ? parsed.title.slice(0, 80) : fallback.title;
    const title = looksLikePrompt(rawTitle, prompt) ? cleanTitleFromPrompt(prompt) : rawTitle;

    const rawDesc = typeof parsed.description === "string" ? parsed.description.slice(0, 200) : fallback.description;
    const description = looksLikePrompt(rawDesc, prompt) ? fallback.description : rawDesc;

    return {
      title,
      category: typeof parsed.category === "string" && categorySlugs.includes(parsed.category)
        ? parsed.category
        : fallback.category,
      description,
      slug: typeof parsed.slug === "string" ? slugify(parsed.slug) : fallback.slug,
    };
  } catch (err) {
    console.error("Classification failed, using fallback:", err);
    Sentry.captureException(err, {
      tags: { type: "classification_fallback", content_type: ct, style },
    });
    return fallback;
  }
}

export async function generateCategorySEO(categoryName: string): Promise<{
  h1: string;
  meta_title: string;
  meta_description: string;
  intro: string;
  seo_content: string[];
  suggested_prompts: string[];
}> {
  const fallback = {
    h1: `${categoryName} Clip Art`,
    meta_title: `${categoryName} Clip Art — Free AI Generated ${categoryName} Images`,
    meta_description: `Browse and generate ${categoryName.toLowerCase()} clip art. Create custom illustrations with AI instantly.`,
    intro: `Find the perfect ${categoryName.toLowerCase()} clip art for your projects, or generate your own with AI in seconds.`,
    seo_content: [] as string[],
    suggested_prompts: [] as string[],
  };

  try {
    const systemPrompt = `You generate SEO content for clip art category pages on clip.art. Return JSON with:
- "h1": Page heading (e.g. "Birthday Clip Art")
- "meta_title": SEO title tag (max 60 chars, include "clip art" and "free")
- "meta_description": Meta description (max 155 chars)
- "intro": Introductory paragraph (1-2 sentences)
- "seo_content": Array of 2 paragraphs about this clip art category
- "suggested_prompts": Array of 3 example prompts users could try

Return ONLY valid JSON.`;

    const rawText = await generateText(
      "seo_generation",
      systemPrompt,
      `Category: "${categoryName}"`,
      { temperature: 0.3 },
    );

    const cleaned = rawText.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      h1: parsed.h1 || fallback.h1,
      meta_title: parsed.meta_title || fallback.meta_title,
      meta_description: parsed.meta_description || fallback.meta_description,
      intro: parsed.intro || fallback.intro,
      seo_content: Array.isArray(parsed.seo_content) ? parsed.seo_content : fallback.seo_content,
      suggested_prompts: Array.isArray(parsed.suggested_prompts) ? parsed.suggested_prompts : fallback.suggested_prompts,
    };
  } catch (err) {
    console.error("Category SEO generation failed:", err);
    Sentry.captureException(err, {
      tags: { type: "seo_generation_fallback", category: categoryName },
    });
    return fallback;
  }
}
