import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UserGenerationsView, type UserGeneration } from "./generations-view";

export const revalidate = 0;

interface ProfileRow {
  id: string;
  email: string;
  credits: number;
  created_at: string;
  last_seen_at: string | null;
}

async function getUser(id: string) {
  const admin = createSupabaseAdmin();

  const { data: profileData } = await admin
    .from("profiles")
    .select("id, email, credits, created_at, last_seen_at")
    .eq("id", id)
    .single();

  const profile = profileData as ProfileRow | null;
  if (!profile) return null;

  const { data: generations, count } = await admin
    .from("generations")
    .select(
      "id, prompt, title, slug, image_url, style, content_type, category, is_public, is_featured, model, user_id, created_at",
      { count: "exact" },
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (generations || []) as UserGeneration[];

  return {
    profile,
    generations: rows.map((g) => ({ ...g, user_email: profile.email })),
    total: count || 0,
  };
}

function formatDate(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

interface PageProps {
  params: { id: string };
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const data = await getUser(params.id);
  if (!data) notFound();

  const { profile, generations, total } = data;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/users" className="hover:text-gray-600">
          Users
        </Link>
        <span>/</span>
        <span className="text-gray-700">{profile.email}</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.email}</h1>
            <p className="mt-1 text-xs text-gray-400">{profile.id}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
            <Stat label="Credits" value={profile.credits.toLocaleString()} />
            <Stat label="Generated" value={total.toLocaleString()} />
            <Stat label="Signed up" value={formatDate(profile.created_at)} />
            <Stat label="Last seen" value={formatDate(profile.last_seen_at)} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Generations{" "}
          <span className="text-base font-normal text-gray-400">
            ({total.toLocaleString()}
            {total > generations.length ? ` — showing latest ${generations.length}` : ""})
          </span>
        </h2>

        {generations.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
            This user hasn&apos;t generated anything yet.
          </div>
        ) : (
          <UserGenerationsView generations={generations} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
