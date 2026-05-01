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

interface PackRelease {
  id: string;
  release_key: string;
  pack_id: string | null;
  title: string;
  badge_label: string;
  description: string | null;
  target_path: string;
  launch_mode: "manual" | "auto";
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  packs: {
    title: string;
    slug: string;
    cover_image_url: string | null;
    categories: { slug: string; name: string } | null;
  } | null;
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
  const [releases, setReleases] = useState<PackRelease[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [autoLaunchOnPublish, setAutoLaunchOnPublish] = useState(false);
  const [launchingPackId, setLaunchingPackId] = useState<string | null>(null);

  const fetchReleases = useCallback(async () => {
    setReleasesLoading(true);
    const res = await fetch("/api/admin/packs/releases");
    const data = await res.json();
    setReleases(data.releases || []);
    setReleasesLoading(false);
  }, []);

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

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

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
      body: JSON.stringify({
        is_published: !currentValue,
        auto_launch_release: !currentValue && autoLaunchOnPublish,
      }),
    });
    setPacks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_published: !currentValue } : p)),
    );
    if (!currentValue && autoLaunchOnPublish) fetchReleases();
  }

  async function launchPackRelease(pack: Pack, launchMode: "manual" | "auto" = "manual") {
    setLaunchingPackId(pack.id);
    const targetPath = pack.categories?.slug
      ? `/packs/${pack.categories.slug}/${pack.slug}`
      : `/packs/all/${pack.slug}`;
    const res = await fetch("/api/admin/packs/releases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack_id: pack.id,
        title: `${pack.title} is live`,
        badge_label: "New drop",
        description: `New pack released: ${pack.title}`,
        target_path: targetPath,
        launch_mode: launchMode,
        is_active: true,
      }),
    });
    setLaunchingPackId(null);
    if (res.ok) fetchReleases();
  }

  async function setReleaseActive(release: PackRelease, isActive: boolean) {
    await fetch("/api/admin/packs/releases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: release.id, is_active: isActive }),
    });
    fetchReleases();
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Packs Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage pack publishing, pricing, featured status, and package drop notifications.
          </p>
        </div>
        <label className="flex w-fit items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700">
          <input
            type="checkbox"
            checked={autoLaunchOnPublish}
            onChange={(e) => setAutoLaunchOnPublish(e.target.checked)}
            className="h-4 w-4 rounded border-orange-200 text-orange-500"
          />
          Auto-launch notification when publishing
        </label>
      </div>

      <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-pink-50 via-orange-50 to-amber-50 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-500">
                Package drop notification
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-950">
                Active launch for all users
              </h2>
            </div>
            <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-500 shadow-sm">
              Dismissed per user/browser
            </span>
          </div>
        </div>

        <div className="p-5">
          {releasesLoading ? (
            <p className="text-sm text-gray-400">Loading releases...</p>
          ) : releases.length === 0 ? (
            <p className="text-sm text-gray-500">
              No pack release notifications yet. Use “Launch drop” on a published pack below.
            </p>
          ) : (
            <div className="space-y-3">
              {releases.slice(0, 5).map((release) => (
                <div
                  key={release.id}
                  className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                    release.is_active ? "border-orange-200 bg-orange-50/70" : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        release.is_active ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                        {release.is_active ? "Active" : "Inactive"}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        {release.launch_mode}
                      </span>
                      <span className="text-xs text-gray-400">{release.release_key}</span>
                    </div>
                    <p className="mt-1 font-semibold text-gray-950">{release.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {release.badge_label} {"->"} {release.target_path}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={release.target_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      View
                    </a>
                    <button
                      onClick={() => setReleaseActive(release, !release.is_active)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        release.is_active
                          ? "bg-gray-900 text-white hover:bg-gray-800"
                          : "bg-orange-500 text-white hover:bg-orange-600"
                      }`}
                    >
                      {release.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
                          href={`/packs/${pack.categories.slug}/${pack.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View
                        </a>
                      )}
                      {pack.is_published && (
                        <button
                          onClick={() => launchPackRelease(pack)}
                          disabled={launchingPackId === pack.id}
                          className="text-xs font-medium text-orange-500 hover:text-orange-700 disabled:opacity-50"
                        >
                          {launchingPackId === pack.id ? "Launching..." : "Launch drop"}
                        </button>
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
