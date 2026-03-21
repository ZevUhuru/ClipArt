import { createSupabaseAdmin } from "@/lib/supabase/server";
import Link from "next/link";

export const revalidate = 0;

async function getStats() {
  const admin = createSupabaseAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalGen, todayGen, totalPurchases, categoriesCount] = await Promise.all([
    admin.from("generations").select("id", { count: "exact", head: true }),
    admin.from("generations").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    admin.from("purchases").select("amount_cents", { count: "exact" }),
    admin.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const totalRevenue = (totalPurchases.data || []).reduce(
    (sum: number, p: { amount_cents: number }) => sum + p.amount_cents, 0
  );

  return {
    totalGenerations: totalGen.count || 0,
    todayGenerations: todayGen.count || 0,
    totalRevenue: totalRevenue / 100,
    totalPurchases: totalPurchases.count || 0,
    totalCategories: categoriesCount.count || 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Total Generations", value: stats.totalGenerations.toLocaleString(), href: "/admin/images" },
    { label: "Today", value: stats.todayGenerations.toLocaleString(), href: "/admin/images" },
    { label: "Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, href: "#" },
    { label: "Purchases", value: stats.totalPurchases.toLocaleString(), href: "#" },
    { label: "Categories", value: stats.totalCategories.toLocaleString(), href: "/admin/categories" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/images"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">Manage Images</h2>
          <p className="mt-1 text-sm text-gray-500">Edit titles, categories, visibility, and metadata for all generated clip art.</p>
        </Link>
        <Link
          href="/admin/categories"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">Manage Categories</h2>
          <p className="mt-1 text-sm text-gray-500">Create and edit categories with SEO fields. Auto-generate SEO content with AI.</p>
        </Link>
      </div>
    </div>
  );
}
