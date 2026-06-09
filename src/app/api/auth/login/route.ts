import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSession } from "@/lib/session";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId, pin } = await req.json().catch(() => ({}));

  if (typeof userId !== "string" || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "A 4-digit PIN is required." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, role, active, created_at, pin_hash")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (!user.active) {
    return NextResponse.json({ error: "This account is disabled." }, { status: 403 });
  }

  const pinHash = user.pin_hash as string | null;

  if (!pinHash) {
    // First login: the entered PIN becomes the user's PIN.
    const hash = await bcrypt.hash(pin, 10);
    const { error: updateError } = await supabase
      .from("users")
      .update({ pin_hash: hash })
      .eq("id", user.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const ok = await bcrypt.compare(pin, pinHash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }
  }

  await createSession({
    userId: user.id as string,
    name: user.name as string,
    role: user.role as User["role"],
  });

  const safeUser: User = {
    id: user.id as string,
    name: user.name as string,
    role: user.role as User["role"],
    active: user.active as boolean,
    created_at: user.created_at as string,
    has_pin: true,
  };

  return NextResponse.json({ user: safeUser });
}
