import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UsersTable } from "./users-table";

export const revalidate = 0;

export interface Profile {
  id: string;
  email: string;
  credits: number;
  created_at: string;
  last_sign_in_at: string | null;
}

async function getUsers() {
  const admin = createSupabaseAdmin();

  const { data: users, count } = await admin
    .from("profiles")
    .select("id, email, credits, created_at", { count: "exact" })
    .not("email", "like", "%@esy.com")
    .order("created_at", { ascending: false });

  const profiles = (users || []) as { id: string; email: string; credits: number; created_at: string }[];

  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const signInMap = new Map<string, string | null>();
  for (const u of authData?.users || []) {
    signInMap.set(u.id, u.last_sign_in_at ?? null);
  }

  const merged: Profile[] = profiles.map((p) => ({
    ...p,
    last_sign_in_at: signInMap.get(p.id) ?? null,
  }));

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
