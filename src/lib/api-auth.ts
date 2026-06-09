import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "./session";
import { supabaseAdmin } from "./supabase/admin";
import type { Role } from "./types";

export interface AuthedUser {
  id: string;
  name: string;
  role: Role;
  active: boolean;
}

/**
 * Resolve the current request's authenticated, *active* user, re-read from
 * the database so role/active changes take effect immediately.
 * Returns either { user } or { response } (a 401/403 to return directly).
 */
export async function requireUser(): Promise<
  { user: AuthedUser; response?: never } | { user?: never; response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("id, name, role, active")
    .eq("id", session.userId)
    .single();

  if (error || !data || !data.active) {
    return { response: NextResponse.json({ error: "Account unavailable" }, { status: 403 }) };
  }

  return { user: data as AuthedUser };
}

export async function requireAdmin(): Promise<
  { user: AuthedUser; response?: never } | { user?: never; response: NextResponse }
> {
  const result = await requireUser();
  if (result.response) return result;
  if (result.user.role !== "admin") {
    return { response: NextResponse.json({ error: "Admin only" }, { status: 403 }) };
  }
  return result;
}
