import type { Metadata } from "next";

export const SITE_URL = "https://clip.art";
export const SITE_NAME = "clip.art";
export const DEFAULT_SOCIAL_IMAGE = {
  url: `${SITE_URL}/social-card/homepage-kawaii-ramen.png`,
  width: 1200,
  height: 630,
  alt: "Kawaii ramen panda and cute Japanese food clip art generated on clip.art",
};

export type ContentType = "clipart" | "coloring" | "illustration" | "pack" | "worksheet";

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  clipart: "Clip Art",
  coloring: "Coloring Page",
  illustration: "Illustration",
  pack: "Design Pack",
  worksheet: "Worksheet",
};

const CONTENT_TYPE_LABELS_PLURAL: Record<ContentType, string> = {
  clipart: "Clip Art",
  coloring: "Coloring Pages",
  illustration: "Illustrations",
  pack: "Design Packs",
  worksheet: "Worksheets",
};

const MAX_TITLE_LENGTH = 60;
const TEMPLATE_SUFFIX_LENGTH = " | clip.art".length;

export function buildTitle(
  subject: string,
  opts?: { categoryName?: string; contentType?: ContentType },
): string {
  const { categoryName, contentType = "clipart" } = opts || {};
  const label = CONTENT_TYPE_LABELS[contentType];

  let middle: string;
  if (categoryName) {
    const isFreeCategory = categoryName.toLowerCase() === "free";
    middle = isFreeCategory
      ? ` — Free ${label}`
      : ` — Free ${categoryName} ${label}`;
  } else {
    middle = ` — Free ${label}`;
  }

  const overhead = middle.length + TEMPLATE_SUFFIX_LENGTH;
  const maxSubjectLen = MAX_TITLE_LENGTH - overhead;

  let truncated = subject;
  if (truncated.length > maxSubjectLen && maxSubjectLen > 10) {
    truncated = truncated.slice(0, maxSubjectLen - 1).trimEnd() + "…";
  }

  return `${truncated}${middle}`;
}

export function buildDescription(
  rawText: string,
  contentType: ContentType = "clipart",
): string {
  const label = CONTENT_TYPE_LABELS[contentType].toLowerCase();
  const clean = rawText.replace(/\s+/g, " ").trim();

  if (clean.length >= 100 && clean.length <= 160) return clean;

  if (clean.length < 100) {
    const suffix = ` Download this free AI-generated ${label} for personal and commercial use on clip.art.`;
    const padded = clean + suffix;
    return padded.length <= 160 ? padded : padded.slice(0, 157).trimEnd() + "…";
  }

  const boundary = clean.lastIndexOf(".", 155);
  if (boundary > 80) return clean.slice(0, boundary + 1);

  const commaBoundary = clean.lastIndexOf(",", 155);
  if (commaBoundary > 80) return clean.slice(0, commaBoundary).trimEnd() + "…";

  return clean.slice(0, 157).trimEnd() + "…";
}

export function buildCanonical(path: string): string {
  const normalized = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized ? `${SITE_URL}/${normalized}` : SITE_URL;
}

export function contentTypePath(
  contentType: ContentType,
  category: string,
  slug: string,
): string {
  switch (contentType) {
    case "coloring":
      return `coloring-pages/${category}/${slug}`;
    case "illustration":
      return `illustrations/${category}/${slug}`;
    case "pack":
      return `design-bundles/${category}/${slug}`;
    case "worksheet":
      // Worksheets have a 4-level path; `category` here is expected to be the
      // composite "grade/subject/topic" string. Callers that can't build that
      // composite should use `worksheetDetailPath()` instead.
      return `worksheets/${category}/${slug}`;
    default:
      return `${category}/${slug}`;
  }
}

export function worksheetDetailPath(
  grade: string,
  subject: string,
  topic: string,
  slug: string,
): string {
  return `worksheets/${grade}/${subject}/${topic}/${slug}`;
}

export function categoryPath(
  contentType: ContentType,
  categorySlug: string,
): string {
  switch (contentType) {
    case "coloring":
      return `coloring-pages/${categorySlug}`;
    case "illustration":
      return `illustrations/${categorySlug}`;
    case "pack":
      return `design-bundles/${categorySlug}`;
    case "worksheet":
      // `categorySlug` for worksheets is the composite "grade" or "grade/subject"
      // or "grade/subject/topic" — caller decides which hub level to link to.
      return `worksheets/${categorySlug}`;
    default:
      return categorySlug;
  }
}

interface PageMetadataOpts {
  subject: string;
  description: string;
  contentType?: ContentType;
  categoryName?: string;
  path: string;
  image?: { url: string; alt: string };
  type?: "website" | "article";
  overrides?: Partial<Metadata>;
}

export function buildPageMetadata(opts: PageMetadataOpts): Metadata {
  const {
    subject,
    description: rawDesc,
    contentType = "clipart",
    categoryName,
    path,
    image,
    type = "article",
    overrides,
  } = opts;

  const title = buildTitle(subject, { categoryName, contentType });
  const description = buildDescription(rawDesc, contentType);
  const canonical = buildCanonical(path);
  const socialImage = image
    ? { url: image.url, alt: image.alt, width: 1200, height: 630 }
    : DEFAULT_SOCIAL_IMAGE;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
    ...overrides,
  };
}

export function buildListingMetadata(opts: {
  title?: string | null;
  description?: string | null;
  categoryName: string;
  contentType: ContentType;
  path: string;
}): Metadata {
  const { title: customTitle, description: customDesc, categoryName, contentType, path } = opts;
  const label = CONTENT_TYPE_LABELS_PLURAL[contentType];
  const fallbackTitle = `${categoryName} ${label} — Free AI ${label}`;
  const fallbackDesc = `Free ${categoryName.toLowerCase()} ${label.toLowerCase()}. Create and download AI-generated ${categoryName.toLowerCase()} ${label.toLowerCase()} on clip.art.`;

  const title = customTitle || fallbackTitle;
  const description = customDesc || fallbackDesc;
  const canonical = buildCanonical(path);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_SOCIAL_IMAGE.url],
    },
  };
}
