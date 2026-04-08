"use client";

import { useCallback, useEffect, useState } from "react";

interface Pack {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  item_count: number;
  visibility: string;
  is_free: boolean;
  price_cents: number | null;
  is_published: boolean;
  is_featured: boolean;
  downloads: number;
  zip_status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  categories: { slug: string; name: string } | null;
}

export default function AdminPacksPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [freeFilter, setFreeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const fetchPacks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("q", search);
    if (featuredFilter) params.set("is_featured", featuredFilter);
    if (freeFilter) params.set("is_free", freeFilter);

    const res = await fetch(`/api/admin/packs?${params}`);
    const data = await res.json();
    setPacks(data.packs || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, search, featuredFilter, freeFilter]);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  async function toggleFeatured(id: string, currentValue: boolean) {
    await fetch(`/api/admin/packs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !currentValue }),
    });
    setPacks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_featured: !currentValue } : p)),
    );
  }

  async function togglePublished(id: string, currentValue: boolean) {
    await fetch(`/api/admin/packs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !currentValue }),
    });
    setPacks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_published: !currentValue } : p)),
    );
  }

  async function setPrice(id: string) {
    const cents = Math.round(parseFloat(priceInput) * 100);
    if (isNaN(cents) || cents < 0) return;

    const isFree = cents === 0;
    await fetch(`/api/admin/packs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_free: isFree,
        price_cents: isFree ? null : cents,
      }),
    });
    setPacks((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, is_free: isFree, price_cents: isFree ? null : cents }
          : p,
      ),
    );
    setEditingPrice(null);
    setPriceInput("");
  }

  async function deletePack(id: string) {
    if (!confirm("Delete this pack permanently?")) return;
    await fetch(`/api/admin/packs/${id}`, { method: "DELETE" });
    setPacks((prev) => prev.filter((p) => p.id !== id));
    setTotal((prev) => prev - 1);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Packs Management</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search packs..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          value={featuredFilter}
          onChange={(e) => {
            setFeaturedFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All Featured</option>
          <option value="true">Featured</option>
          <option value="false">Not Featured</option>
        </select>
        <select
          value={freeFilter}
          onChange={(e) => {
            setFreeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All Pricing</option>
          <option value="true">Free</option>
          <option value="false">Paid</option>
        </select>
        <span className="self-center text-sm text-gray-500">{total} packs</span>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 font-medium text-gray-500">Pack</th>
                <th className="px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 font-medium text-gray-500">Items</th>
                <th className="px-4 py-3 font-medium text-gray-500">Downloads</th>
                <th className="px-4 py-3 font-medium text-gray-500">Price</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Featured</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((pack) => (
                <tr key={pack.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {pack.cover_image_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={pack.cover_image_url}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{pack.title}</p>
                        <p className="text-xs text-gray-400">{pack.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {pack.categories?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{pack.item_count}</td>
                  <td className="px-4 py-3 text-gray-500">{pack.downloads}</td>
                  <td className="px-4 py-3">
                    {editingPrice === pack.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          className="w-20 rounded border border-gray-200 px-2 py-1 text-xs"
                          placeholder="0 = free"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setPrice(pack.id);
                            if (e.key === "Escape") setEditingPrice(null);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => setPrice(pack.id)}
                          className="rounded bg-green-500 px-2 py-1 text-xs text-white"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPrice(pack.id);
                          setPriceInput(
                            pack.price_cents ? (pack.price_cents / 100).toFixed(2) : "0",
                          );
                        }}
                        className="rounded px-2 py-0.5 text-xs font-medium hover:bg-gray-100"
                      >
                        {pack.is_free ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          <span className="text-gray-900">
                            ${((pack.price_cents || 0) / 100).toFixed(2)}
                          </span>
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublished(pack.id, pack.is_published)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        pack.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {pack.is_published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFeatured(pack.id, pack.is_featured)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        pack.is_featured
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {pack.is_featured ? "Featured" : "—"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {pack.is_published && pack.categories?.slug && (
                        <a
                          href={`/design-bundles/${pack.categories.slug}/${pack.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View
                        </a>
                      )}
                      <button
                        onClick={() => deletePack(pack.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
