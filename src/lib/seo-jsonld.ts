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

interface PackJsonLdOpts {
  title: string;
  description: string;
  coverUrl?: string;
  itemCount: number;
  isFree: boolean;
  priceCents?: number | null;
  categorySlug: string;
  slug: string;
  tags: string[];
  downloads: number;
}

export function buildPackJsonLd(opts: PackJsonLdOpts) {
  const url = `${SITE_URL}/design-bundles/${opts.categorySlug}/${opts.slug}`;

  if (opts.isFree) {
    return {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: opts.title,
      description: opts.description,
      url,
      ...(opts.coverUrl ? { image: opts.coverUrl } : {}),
      isAccessibleForFree: true,
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      keywords: opts.tags.join(", "),
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/DownloadAction",
        userInteractionCount: opts.downloads,
      },
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.title,
    description: opts.description,
    url,
    ...(opts.coverUrl ? { image: opts.coverUrl } : {}),
    brand: { "@type": "Organization", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: ((opts.priceCents || 0) / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url,
    },
    keywords: opts.tags.join(", "),
  };
}

export function buildPackBreadcrumb(opts: {
  categorySlug: string;
  categoryName: string;
  packTitle: string;
  packSlug: string;
}) {
  return buildBreadcrumbJsonLd([
    { name: "Home", path: SITE_URL },
    { name: "Design Bundles", path: "design-bundles" },
    { name: `${opts.categoryName} Bundles`, path: `design-bundles/${opts.categorySlug}` },
    { name: opts.packTitle, path: `design-bundles/${opts.categorySlug}/${opts.packSlug}` },
  ]);
}

export function buildPackListJsonLd(packs: { title: string; categorySlug: string; slug: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: packs.map((pack, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: pack.title,
      url: `${SITE_URL}/design-bundles/${pack.categorySlug}/${pack.slug}`,
    })),
  };
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
