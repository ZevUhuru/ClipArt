"use client";

import { useCallback, useEffect, useState } from "react";

interface Category {
  id: string;
  slug: string;
  name: string;
  h1: string;
  meta_title: string | null;
  meta_description: string | null;
  intro: string | null;
  seo_content: string[];
  suggested_prompts: string[];
  related_slugs: string[];
  image_count: number;
  is_active: boolean;
  sort_order: number;
  type: string;
}

type CategoryType = "clipart" | "coloring" | "illustration";

const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: "clipart", label: "Clip Art" },
  { value: "illustration", label: "Illustration" },
  { value: "coloring", label: "Coloring" },
];

function getCategoryHref(cat: Category): string {
  if (cat.type === "coloring") return `/coloring-pages/${cat.slug}`;
  if (cat.type === "illustration") return `/illustrations/${cat.slug}`;
  return `/${cat.slug}`;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formSlug, setFormSlug] = useState("");
  const [formName, setFormName] = useState("");
  const [formH1, setFormH1] = useState("");
  const [formMetaTitle, setFormMetaTitle] = useState("");
  const [formMetaDesc, setFormMetaDesc] = useState("");
  const [formIntro, setFormIntro] = useState("");
  const [formType, setFormType] = useState<CategoryType>("clipart");
  const [autoSeo, setAutoSeo] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function resetForm() {
    setFormSlug("");
    setFormName("");
    setFormH1("");
    setFormMetaTitle("");
    setFormMetaDesc("");
    setFormIntro("");
    setFormType("clipart");
    setAutoSeo(true);
    setEditId(null);
    setShowForm(false);
  }

  function editCategory(cat: Category) {
    setEditId(cat.id);
    setFormSlug(cat.slug);
    setFormName(cat.name);
    setFormH1(cat.h1);
    setFormMetaTitle(cat.meta_title || "");
    setFormMetaDesc(cat.meta_description || "");
    setFormIntro(cat.intro || "");
    setFormType((cat.type as CategoryType) || "clipart");
    setAutoSeo(false);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body: Record<string, unknown> = {
      slug: formSlug,
      name: formName,
      auto_seo: autoSeo,
    };

    body.type = formType;

    if (!autoSeo) {
      body.h1 = formH1 || `${formName} Clip Art`;
      body.meta_title = formMetaTitle || null;
      body.meta_description = formMetaDesc || null;
      body.intro = formIntro || null;
    }

    if (editId) {
      await fetch(`/api/admin/categories/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    resetForm();
    fetchCategories();
  }

  async function toggleActive(cat: Category) {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !cat.is_active }),
    });
    fetchCategories();
  }

  async function deleteCategory(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"? Images in this category will NOT be deleted.`)) return;
    await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    fetchCategories();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-600"
        >
          + New Category
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editId ? "Edit Category" : "New Category"}
          </h2>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              {CATEGORY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormType(t.value)}
                  className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
                    formType === t.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (!editId) setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""));
                }}
                required
                placeholder="e.g. Birthday"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Slug (URL path)</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                required
                placeholder="e.g. birthday"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={autoSeo}
                onChange={(e) => setAutoSeo(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-pink-500 peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm text-gray-600">Auto-generate SEO fields with AI</span>
          </div>

          {!autoSeo && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">H1 Heading</label>
                <input
                  type="text"
                  value={formH1}
                  onChange={(e) => setFormH1(e.target.value)}
                  placeholder="e.g. Birthday Clip Art"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Meta Title</label>
                <input
                  type="text"
                  value={formMetaTitle}
                  onChange={(e) => setFormMetaTitle(e.target.value)}
                  placeholder="Max 60 chars"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Meta Description</label>
                <textarea
                  value={formMetaDesc}
                  onChange={(e) => setFormMetaDesc(e.target.value)}
                  rows={2}
                  placeholder="Max 155 chars"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Intro</label>
                <textarea
                  value={formIntro}
                  onChange={(e) => setFormIntro(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : editId ? "Update Category" : "Create Category"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Type filter */}
      <div className="mt-6 inline-flex rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTypeFilter("")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
            typeFilter === "" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All
        </button>
        {CATEGORY_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              typeFilter === t.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Order</th>
              <th className="px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 font-medium text-gray-500">Slug</th>
              <th className="px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Images</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading...</td>
              </tr>
            ) : (
              categories.filter((cat) => !typeFilter || cat.type === typeFilter).map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{cat.sort_order}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{cat.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      cat.type === "illustration"
                        ? "bg-purple-100 text-purple-700"
                        : cat.type === "coloring"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}>
                      {cat.type || "clipart"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{cat.image_count}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(cat)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        cat.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {cat.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editCategory(cat)}
                        className="text-sm font-medium text-pink-600 hover:text-pink-700"
                      >
                        Edit
                      </button>
                      <a
                        href={getCategoryHref(cat)}
                        target="_blank"
                        className="text-sm font-medium text-gray-400 hover:text-gray-600"
                      >
                        View
                      </a>
                      <button
                        onClick={() => deleteCategory(cat)}
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
    </div>
  );
}
