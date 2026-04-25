import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UsersTable } from "./users-table";

export const revalidate = 0;

export interface Profile {
  id: string;
  email: string;
  credits: number;
  created_at: string;
  last_seen_at: string | null;
  generation_count: number;
  last_generation_at: string | null;
}

async function getUsers(): Promise<{ users: Profile[]; total: number }> {
  const admin = createSupabaseAdmin();

  const { data: users, count } = await admin
    .from("profiles")
    .select("id, email, credits, created_at, last_seen_at", { count: "exact" })
    .not("email", "like", "%@esy.com")
    .order("last_seen_at", { ascending: false, nullsFirst: false });

  const profiles = (users || []) as Omit<Profile, "generation_count" | "last_generation_at">[];

  // Pull per-user generation aggregates from the admin_user_stats view.
  const { data: stats } = await admin
    .from("admin_user_stats")
    .select("id, generation_count, last_generation_at");

  const statsMap = new Map<string, { generation_count: number; last_generation_at: string | null }>();
  for (const row of stats || []) {
    statsMap.set(row.id as string, {
      generation_count: Number(row.generation_count) || 0,
      last_generation_at: (row.last_generation_at as string | null) ?? null,
    });
  }

  const merged: Profile[] = profiles.map((p) => {
    const s = statsMap.get(p.id);
    return {
      ...p,
      generation_count: s?.generation_count ?? 0,
      last_generation_at: s?.last_generation_at ?? null,
    };
  });

  return { users: merged, total: count || 0 };
}

export default async function AdminUsersPage() {
  const { users, total } = await getUsers();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
          {total.toLocaleString()} total
        </span>
      </div>

      <UsersTable users={users} />
    </div>
  );
}
