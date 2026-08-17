import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

// Add a new user (admin only). PIN is set by the user on their first login.
export async function POST(req: NextRequest) {
  const { user, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const name = (body.name as string)?.trim();
  const role =
    body.role === "admin" ? "admin" : body.role === "chef" ? "chef" : "user";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("users")
    .insert({ name, role })
    .select("id, name, role, active, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A user with that name already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(user.id, "user_added", { new_user_id: data.id, name, role });

  const created: User = {
    id: data.id as string,
    name: data.name as string,
    role: data.role as User["role"],
    active: data.active as boolean,
    created_at: data.created_at as string,
    has_pin: false,
  };
  return NextResponse.json(created, { status: 201 });
}
