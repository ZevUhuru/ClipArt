import { SITE_URL, SITE_NAME, type ContentType, contentTypePath, categoryPath } from "./seo";

interface ImageJsonLdOpts {
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
}

export function buildImageJsonLd(opts: ImageJsonLdOpts) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: opts.title,
    description: opts.description,
    contentUrl: opts.imageUrl,
    thumbnailUrl: opts.imageUrl,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    copyrightHolder: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    license: `${SITE_URL}/free`,
    acquireLicensePage: `${SITE_URL}/free`,
    keywords: opts.tags.join(", "),
  };
}

interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.path.startsWith("http") ? item.path : `${SITE_URL}/${item.path.replace(/^\/+/, "")}`,
    })),
  };
}

export function buildDetailBreadcrumb(opts: {
  contentType: ContentType;
  categorySlug: string;
  categoryName: string;
  imageTitle: string;
  imageSlug: string;
}) {
  const { contentType, categorySlug, categoryName, imageTitle, imageSlug } = opts;

  const items: BreadcrumbItem[] = [{ name: "Home", path: SITE_URL }];

  if (contentType === "coloring") {
    items.push({ name: "Coloring Pages", path: "coloring-pages" });
    items.push({ name: `${categoryName} Coloring Pages`, path: categoryPath(contentType, categorySlug) });
  } else if (contentType === "illustration") {
    items.push({ name: "Illustrations", path: "illustrations" });
    items.push({ name: `${categoryName} Illustrations`, path: categoryPath(contentType, categorySlug) });
  } else {
    items.push({ name: `${categoryName} Clip Art`, path: categoryPath(contentType, categorySlug) });
  }

  items.push({ name: imageTitle, path: contentTypePath(contentType, categorySlug, imageSlug) });

  return buildBreadcrumbJsonLd(items);
}

interface VideoJsonLdOpts {
  title: string;
  description: string;
  thumbnailUrl?: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl: string;
}

export function buildVideoJsonLd(opts: VideoJsonLdOpts) {
  const ld: Record<string, unknown> = {
    "@type": "VideoObject",
    name: opts.title,
    description: opts.description,
    uploadDate: opts.uploadDate,
    embedUrl: opts.embedUrl,
  };

  if (opts.thumbnailUrl) ld.thumbnailUrl = opts.thumbnailUrl;
  if (opts.contentUrl) ld.contentUrl = opts.contentUrl;

  if (opts.duration) {
    const parts = opts.duration.split(":");
    if (parts.length === 2) {
      ld.duration = `PT${parts[0]}M${parts[1]}S`;
    }
  }

  return ld;
}
