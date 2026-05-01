"use client";

import Link from "next/link";
import Image from "next/image";
import { getPackArtworkForPack } from "@/data/packArtwork";
import { packPath } from "@/lib/packRoutes";

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
  const href = packPath(pack);
  const priceLabel = pack.is_free
    ? "Free"
    : `$${((pack.price_cents || 0) / 100).toFixed(2)}`;
  const formatLabel = pack.formats
    .filter((format) => format.toLowerCase() !== "svg")
    .map((format) => format.toUpperCase())
    .join(" / ");
  const artworkOverride = getPackArtworkForPack(pack);
  const coverImageUrl = artworkOverride?.imageUrl || pack.cover_image_url;

  return (
    <Link
      href={href}
      aria-label={`Open ${pack.title} pack`}
      title={`Open ${pack.title} pack`}
      className="group relative block overflow-hidden bg-transparent transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-transparent drop-shadow-2xl transition-all duration-300 group-hover:drop-shadow-[0_24px_28px_rgba(0,0,0,0.45)]">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={pack.title}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-[1.025]"
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 38vw, 22vw"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-amber-950 to-gray-950 p-5 text-center">
            <svg className="h-12 w-12 text-amber-200/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="mt-4 font-serif text-2xl font-black leading-tight text-amber-50">
              {pack.title}
            </p>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/48 to-transparent px-3 pb-3 pt-14 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="block border border-amber-200/45 bg-black/72 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.18em] text-amber-50 backdrop-blur-sm">
            Open pack
          </span>
        </div>
      </div>

      <div className="mt-3">
        <h3 className="line-clamp-2 text-sm font-black tracking-tight text-current transition-colors group-hover:text-amber-300">
          {pack.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-current/55">
          <span>{priceLabel}</span>
          <span>{pack.item_count} item{pack.item_count === 1 ? "" : "s"}</span>
          {pack.content_types[0] && <span>{CONTENT_TYPE_LABELS[pack.content_types[0]] || pack.content_types[0]}</span>}
          {formatLabel && <span>{formatLabel}</span>}
        </div>
      </div>
    </Link>
  );
}
