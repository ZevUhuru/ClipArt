"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ImageData {
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

export default function AdminImageEditPage() {
  const params = useParams();
  const router = useRouter();
  const [image, setImage] = useState<ImageData | null>(null);
  const [categories, setCategories] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredOrder, setFeaturedOrder] = useState("");

  const fetchData = useCallback(async () => {
    const [imgRes, catRes] = await Promise.all([
      fetch(`/api/admin/images/${params.id}`),
      fetch("/api/admin/categories"),
    ]);
    const imgData = await imgRes.json();
    const catData = await catRes.json();

    if (imgData.image) {
      const img = imgData.image;
      setImage(img);
      setTitle(img.title || img.prompt || "");
      setSlug(img.slug || "");
      setDescription(img.description || img.prompt || "");
      setCategory(img.category || "free");
      setIsPublic(img.is_public);
      setIsFeatured(img.is_featured ?? false);
      setFeaturedOrder(img.featured_order != null ? String(img.featured_order) : "");
    }
    setCategories(catData.categories || []);
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/images/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        description,
        category,
        is_public: isPublic,
        is_featured: isFeatured,
        featured_order: featuredOrder ? parseInt(featuredOrder, 10) : null,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setMessage("Saved successfully");
      if (data.image) setImage(data.image);
    } else {
      setMessage(`Error: ${data.error}`);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this image permanently? This cannot be undone.")) return;

    await fetch(`/api/admin/images/${params.id}`, { method: "DELETE" });
    router.push("/admin/images");
  }

  function slugifyTitle() {
    setSlug(
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80),
    );
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading...</div>;
  }

  if (!image) {
    return <div className="py-12 text-center text-gray-400">Image not found</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/images" className="text-sm text-gray-400 hover:text-gray-600">
          &larr; Back to images
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image preview */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.image_url}
            alt={title}
            className="w-full object-contain bg-gray-50 p-4"
            style={{ maxHeight: "500px" }}
          />
          <div className="border-t border-gray-100 p-4">
            <p className="text-xs text-gray-400">Original prompt</p>
            <p className="mt-1 text-sm text-gray-600">{image.prompt}</p>
          </div>
        </div>

        {/* Edit form */}
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              URL Slug
              <button
                type="button"
                onClick={slugifyTitle}
                className="ml-2 text-xs text-pink-500 hover:text-pink-700"
              >
                Auto-generate from title
              </button>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
            >
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name} ({cat.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-pink-500 peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm font-medium text-gray-700">
              {isPublic ? "Public — visible in gallery" : "Hidden — not visible in gallery"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-500 peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm font-medium text-gray-700">
              {isFeatured ? "★ Featured on homepage" : "Not featured"}
            </span>
          </div>

          {isFeatured && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Featured order
                <span className="ml-1 text-xs font-normal text-gray-400">Lower number = shown first</span>
              </label>
              <input
                type="number"
                value={featuredOrder}
                onChange={(e) => setFeaturedOrder(e.target.value)}
                placeholder="e.g. 1, 2, 3..."
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          )}

          {message && (
            <p className={`rounded-lg px-3 py-2 text-sm ${
              message.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}>
              {message}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-200 px-6 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Delete Image
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">
              ID: {image.id} &middot; Style: {image.style} &middot; Created: {new Date(image.created_at).toLocaleString()}
            </p>
            {image.category && slug && (
              <Link
                href={`/${image.category}/${slug}`}
                className="mt-1 block text-xs text-pink-500 hover:text-pink-700"
                target="_blank"
              >
                View public page &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
