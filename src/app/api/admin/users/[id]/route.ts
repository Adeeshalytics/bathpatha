import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Admin: disable/enable a user, change role, or reset their PIN.
 * Resetting the PIN clears pin_hash so the user sets a new PIN on next login.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const patch: { active?: boolean; role?: "admin" | "user"; pin_hash?: string | null } = {};

  if (typeof body.active === "boolean") patch.active = body.active;
  if (body.role === "admin" || body.role === "user") patch.role = body.role;
  if (body.reset_pin === true) patch.pin_hash = null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("users")
    .update(patch)
    .eq("id", id)
    .select("id, name, role, active, created_at, pin_hash")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.reset_pin === true) await logAudit(user.id, "pin_reset", { target_user_id: id });
  if (typeof body.active === "boolean") {
    await logAudit(user.id, body.active ? "user_enabled" : "user_disabled", { target_user_id: id });
  }

  const updated: User = {
    id: data.id as string,
    name: data.name as string,
    role: data.role as User["role"],
    active: data.active as boolean,
    created_at: data.created_at as string,
    has_pin: Boolean(data.pin_hash),
  };
  return NextResponse.json(updated);
}
