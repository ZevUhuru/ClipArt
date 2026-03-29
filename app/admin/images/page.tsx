"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Generation {
  id: string;
  prompt: string;
  title: string | null;
  slug: string | null;
  description: string | null;
  image_url: string;
  style: string;
  category: string | null;
  is_public: boolean;
  is_featured: boolean;
  featured_order: number | null;
  created_at: string;
}

export default function AdminImagesPage() {
  const [images, setImages] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [publicFilter, setPublicFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("q", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (publicFilter) params.set("is_public", publicFilter);
    if (featuredFilter) params.set("is_featured", featuredFilter);

    const res = await fetch(`/api/admin/images?${params}`);
    const data = await res.json();
    setImages(data.images || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, search, categoryFilter, publicFilter, featuredFilter]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  async function togglePublic(id: string, currentValue: boolean) {
    await fetch(`/api/admin/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: !currentValue }),
    });
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, is_public: !currentValue } : img))
    );
  }

  async function toggleFeatured(id: string, currentValue: boolean) {
    await fetch(`/api/admin/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !currentValue }),
    });
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, is_featured: !currentValue } : img))
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

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by title or prompt..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
        />
        <input
          type="text"
          placeholder="Filter category..."
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
        />
        <select
          value={publicFilter}
          onChange={(e) => { setPublicFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
        >
          <option value="">All visibility</option>
          <option value="true">Public</option>
          <option value="false">Hidden</option>
        </select>
        <select
          value={featuredFilter}
          onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
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
              <th className="px-4 py-3 font-medium text-gray-500">Category</th>
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
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : images.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  No images found
                </td>
              </tr>
            ) : (
              images.map((img) => (
                <tr key={img.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt=""
                      className="h-12 w-12 rounded-lg object-contain bg-gray-50"
                    />
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-900">
                    {img.title || img.prompt}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {img.category || "—"}
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
    </div>
  );
}
