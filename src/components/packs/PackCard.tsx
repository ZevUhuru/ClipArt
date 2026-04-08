"use client";

import Link from "next/link";
import Image from "next/image";

interface PackCardProps {
  pack: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    item_count: number;
    content_types: string[];
    formats: string[];
    is_free: boolean;
    price_cents: number | null;
    downloads: number;
    categories?: { slug: string; name: string } | null;
  };
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  clipart: "Clip Art",
  coloring: "Coloring",
  illustration: "Illustration",
};

export function PackCard({ pack }: PackCardProps) {
  const categorySlug = pack.categories?.slug || "all";
  const href = `/packs/${categorySlug}/${pack.slug}`;

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {pack.cover_image_url ? (
          <Image
            src={pack.cover_image_url}
            alt={pack.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
        )}

        <div className="absolute left-2 top-2">
          {pack.is_free ? (
            <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Free
            </span>
          ) : (
            <span className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              ${((pack.price_cents || 0) / 100).toFixed(2)}
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2">
          <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {pack.item_count} items
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-gray-800 group-hover:text-pink-600">
          {pack.title}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1">
          {pack.content_types.map((ct) => (
            <span
              key={ct}
              className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500"
            >
              {CONTENT_TYPE_LABELS[ct] || ct}
            </span>
          ))}
          {pack.formats.map((f) => (
            <span
              key={f}
              className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-500"
            >
              {f.toUpperCase()}
            </span>
          ))}
        </div>

        {pack.downloads > 0 && (
          <p className="mt-2 text-[10px] tabular-nums text-gray-400">
            {pack.downloads.toLocaleString()} downloads
          </p>
        )}
      </div>
    </Link>
  );
}
