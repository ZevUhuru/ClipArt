"use client";

import { useEffect } from "react";
import Link from "next/link";

export interface AdminPreviewImage {
  id: string;
  image_url: string;
  prompt: string;
  title: string | null;
  slug: string | null;
  style: string | null;
  category: string | null;
  content_type: string | null;
  is_public: boolean;
  is_featured: boolean;
  model: string | null;
  user_id: string | null;
  user_email?: string | null;
  created_at: string;
}

interface Props {
  image: AdminPreviewImage | null;
  onClose: () => void;
}

function detailHref(img: AdminPreviewImage): string | null {
  if (!img.slug) return null;
  if (img.content_type === "coloring") {
    return `/coloring-pages/${img.category || "free"}/${img.slug}`;
  }
  if (img.content_type === "illustration") {
    return `/illustrations/${img.category || "free"}/${img.slug}`;
  }
  return `/${img.category || "free"}/${img.slug}`;
}

export function AdminImagePreviewModal({ image, onClose }: Props) {
  useEffect(() => {
    if (!image) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [image, onClose]);

  if (!image) return null;

  const live = detailHref(image);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.image_url}
            alt={image.title || image.prompt}
            className="max-h-[80vh] max-w-full object-contain"
          />
        </div>

        {/* Metadata sidebar */}
        <div className="flex w-[340px] flex-col overflow-y-auto border-l border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Image
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close preview"
              title="Close preview"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5 px-5 py-4 text-sm">
            {image.title && (
              <div>
                <Field label="Title" />
                <p className="mt-1 font-medium text-gray-900">{image.title}</p>
              </div>
            )}

            <div>
              <Field label="Prompt" />
              <p className="mt-1 break-words text-gray-700">{image.prompt}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Type" value={image.content_type || "clipart"} />
              <Stat label="Style" value={image.style || "—"} />
              <Stat label="Category" value={image.category || "—"} />
              <Stat label="Model" value={image.model || "—"} />
              <Stat label="Public" value={image.is_public ? "Yes" : "No"} />
              <Stat label="Featured" value={image.is_featured ? "Yes" : "No"} />
            </div>

            <div>
              <Field label="User" />
              {image.user_id ? (
                <Link
                  href={`/admin/users/${image.user_id}`}
                  className="mt-1 block text-pink-600 hover:text-pink-700"
                >
                  {image.user_email || image.user_id.slice(0, 8) + "…"}
                </Link>
              ) : (
                <p className="mt-1 text-gray-400">Anonymous / batch</p>
              )}
            </div>

            <div>
              <Field label="Created" />
              <p className="mt-1 text-gray-700">
                {new Date(image.created_at).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href={`/admin/images/${image.id}`}
                className="block w-full rounded-lg bg-pink-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-pink-700"
              >
                Edit in admin
              </Link>
              {live && (
                <Link
                  href={live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View live page →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label }: { label: string }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Field label={label} />
      <p className="mt-1 truncate text-gray-700" title={value}>
        {value}
      </p>
    </div>
  );
}
