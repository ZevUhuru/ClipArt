"use client";

import { useState } from "react";
import {
  AdminImagePreviewModal,
  type AdminPreviewImage,
} from "@/components/admin/AdminImagePreviewModal";

export type UserGeneration = AdminPreviewImage;

export function UserGenerationsView({ generations }: { generations: UserGeneration[] }) {
  const [active, setActive] = useState<UserGeneration | null>(null);

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {generations.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActive(g)}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-pink-200 hover:shadow-md"
          >
            <div className="aspect-square w-full overflow-hidden bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.image_url}
                alt={g.title || g.prompt}
                className="h-full w-full object-contain transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="border-t border-gray-100 p-2 text-left">
              <p className="truncate text-xs font-medium text-gray-700">
                {g.title || g.prompt}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-gray-400">
                {new Date(g.created_at).toLocaleDateString()} ·{" "}
                {g.content_type || "clipart"}
                {g.is_public ? " · public" : ""}
              </p>
            </div>
          </button>
        ))}
      </div>

      <AdminImagePreviewModal image={active} onClose={() => setActive(null)} />
    </>
  );
}
