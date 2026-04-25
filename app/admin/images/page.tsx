"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AdminImagePreviewModal,
  type AdminPreviewImage,
} from "@/components/admin/AdminImagePreviewModal";

interface Generation extends AdminPreviewImage {
  description: string | null;
  featured_order: number | null;
}

function AdminImagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdFilter = searchParams.get("user_id") || "";

  const [images, setImages] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [publicFilter, setPublicFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [filteredUserEmail, setFilteredUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<Generation | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("q", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (publicFilter) params.set("is_public", publicFilter);
    if (featuredFilter) params.set("is_featured", featuredFilter);
    if (userIdFilter) params.set("user_id", userIdFilter);

    const res = await fetch(`/api/admin/images?${params}`);
    const data = await res.json();
    setImages(data.images || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setFilteredUserEmail(data.filteredUserEmail || null);
    setLoading(false);
  }, [page, search, categoryFilter, publicFilter, featuredFilter, userIdFilter]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Reset page when the user filter changes (otherwise we can land on page 8 of 1).
  useEffect(() => {
    setPage(1);
  }, [userIdFilter]);

  function clearUserFilter() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("user_id");
    const qs = next.toString();
    router.push(`/admin/images${qs ? `?${qs}` : ""}`);
  }

  async function togglePublic(id: string, currentValue: boolean) {
    await fetch(`/api/admin/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: !currentValue }),
    });
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, is_public: !currentValue } : img)),
    );
  }

  async function toggleFeatured(id: string, currentValue: boolean) {
    await fetch(`/api/admin/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !currentValue }),
    });
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, is_featured: !currentValue } : img,
      ),
    );
  }

  async function deleteImage(id: string) {
    if (!confirm("Delete this image permanently?")) return;
    await fetch(`/api/admin/images/${id}`, { method: "DELETE" });
    setImages((prev) => prev.filter((img) => img.id !== id));
    setTotal((prev) => prev - 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Images <span className="text-base font-normal text-gray-400">({total})</span>
        </h1>
      </div>

      {userIdFilter && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-pink-100 bg-pink-50/60 px-4 py-2.5 text-sm">
          <span className="font-medium text-pink-700">Filtering by user:</span>
          <span className="text-pink-900">
            {filteredUserEmail || userIdFilter.slice(0, 8) + "…"}
          </span>
          <button
            onClick={clearUserFilter}
            className="ml-auto rounded-md px-2 py-0.5 text-xs font-semibold text-pink-700 hover:bg-pink-100"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by title or prompt..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-xl bg-gray-100/80 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 hover:bg-gray-200/60 focus:bg-white focus:shadow-lg focus:shadow-gray-200/50 focus:ring-1 focus:ring-gray-200"
        />
        <input
          type="text"
          placeholder="Filter category..."
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="w-40 rounded-xl bg-gray-100/80 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 hover:bg-gray-200/60 focus:bg-white focus:shadow-lg focus:shadow-gray-200/50 focus:ring-1 focus:ring-gray-200"
        />
        <select
          value={publicFilter}
          onChange={(e) => {
            setPublicFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl bg-gray-100/80 px-3 py-2.5 text-sm text-gray-600 outline-none transition-all duration-200 hover:bg-gray-200/60 focus:bg-white focus:shadow-lg focus:shadow-gray-200/50 focus:ring-1 focus:ring-gray-200"
        >
          <option value="">All visibility</option>
          <option value="true">Public</option>
          <option value="false">Hidden</option>
        </select>
        <select
          value={featuredFilter}
          onChange={(e) => {
            setFeaturedFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl bg-gray-100/80 px-3 py-2.5 text-sm text-gray-600 outline-none transition-all duration-200 hover:bg-gray-200/60 focus:bg-white focus:shadow-lg focus:shadow-gray-200/50 focus:ring-1 focus:ring-gray-200"
        >
          <option value="">All featured</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Image</th>
              <th className="px-4 py-3 font-medium text-gray-500">Title</th>
              <th className="px-4 py-3 font-medium text-gray-500">User</th>
              <th className="px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Style</th>
              <th className="px-4 py-3 font-medium text-gray-500">Public</th>
              <th className="px-4 py-3 font-medium text-gray-500">Featured</th>
              <th className="px-4 py-3 font-medium text-gray-500">Created</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : images.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                  No images found
                </td>
              </tr>
            ) : (
              images.map((img) => (
                <tr key={img.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className="block rounded-lg transition-transform hover:scale-105"
                      aria-label={`Preview ${img.title || img.prompt}`}
                      title="Preview"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.image_url}
                        alt=""
                        className="h-12 w-12 rounded-lg bg-gray-50 object-contain"
                      />
                    </button>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-900">
                    <button
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className="text-left hover:text-pink-600"
                    >
                      {img.title || img.prompt}
                    </button>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-gray-600">
                    {img.user_id ? (
                      <Link
                        href={`/admin/users/${img.user_id}`}
                        className="hover:text-pink-600"
                        title={img.user_email || img.user_id}
                      >
                        {img.user_email || img.user_id.slice(0, 8) + "…"}
                      </Link>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {img.category || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        img.content_type === "illustration"
                          ? "bg-purple-100 text-purple-700"
                          : img.content_type === "coloring"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {img.content_type || "clipart"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{img.style}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublic(img.id, img.is_public)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        img.is_public
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {img.is_public ? "Public" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFeatured(img.id, img.is_featured)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        img.is_featured
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {img.is_featured ? `★ ${img.featured_order ?? ""}` : "—"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(img.created_at).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/images/${img.id}`}
                        className="text-sm font-medium text-pink-600 hover:text-pink-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="text-sm font-medium text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AdminImagePreviewModal
        image={activeImage}
        onClose={() => setActiveImage(null)}
      />
    </div>
  );
}

export default function AdminImagesPage() {
  return (
    <Suspense fallback={<div className="px-4 py-12 text-center text-gray-400">Loading...</div>}>
      <AdminImagesPageInner />
    </Suspense>
  );
}
