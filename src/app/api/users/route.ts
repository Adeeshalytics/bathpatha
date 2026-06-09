import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Public list of active users for the login screen.
 * Only safe, non-sensitive fields are returned (no pin_hash).
 */
export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("id, name, role, active, created_at, pin_hash")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users: User[] = (data ?? []).map((u) => ({
    id: u.id as string,
    name: u.name as string,
    role: u.role as User["role"],
    active: u.active as boolean,
    created_at: u.created_at as string,
    has_pin: Boolean(u.pin_hash),
  }));

  return NextResponse.json(users);
}
