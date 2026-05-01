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
  const priceLabel = pack.is_free
    ? "Free"
    : `$${((pack.price_cents || 0) / 100).toFixed(2)}`;

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-sm ring-1 ring-gray-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-100/70"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_top_left,#fff7ed,transparent_40%),linear-gradient(135deg,#f8fafc,#fff)]">
        {pack.cover_image_url ? (
          <Image
            src={pack.cover_image_url}
            alt={pack.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-black/10 ${
            pack.is_free ? "bg-emerald-500" : "bg-gradient-to-r from-pink-500 to-orange-500"
          }`}>
            {priceLabel}
          </span>
          {pack.categories?.name && (
            <span className="max-w-[9rem] truncate rounded-full bg-white/85 px-3 py-1 text-[10px] font-bold text-gray-600 shadow-sm ring-1 ring-white/70 backdrop-blur">
              {pack.categories.name}
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950/65 via-gray-950/15 to-transparent p-3 pt-12">
          <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-gray-900 shadow-sm backdrop-blur">
            {pack.item_count} ready-to-use item{pack.item_count === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-black tracking-tight text-gray-950 transition-colors group-hover:text-pink-600">
          {pack.title}
        </h3>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {pack.content_types.map((ct) => (
            <span
              key={ct}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600"
            >
              {CONTENT_TYPE_LABELS[ct] || ct}
            </span>
          ))}
          {pack.formats
            .filter((f) => f.toLowerCase() !== "svg")
            .map((f) => (
            <span
              key={f}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600"
            >
              {f.toUpperCase()}
            </span>
          ))}
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
            TRANSPARENT
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <span className="text-[11px] font-semibold tabular-nums text-gray-400">
            {pack.downloads > 0
              ? `${pack.downloads.toLocaleString()} download${pack.downloads === 1 ? "" : "s"}`
              : "New collection"}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.14em] text-gray-900 transition-colors group-hover:text-pink-600">
            Explore
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
