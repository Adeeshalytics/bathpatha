import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const userId = req.nextUrl.searchParams.get("userId");
  let query = supabaseAdmin()
    .from("settlements")
    .select("*")
    .order("settled_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Anyone can record a payment against their own balance; admins can record one
// for any user.
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const user_id = (body.user_id as string) || user.id;
  const amount = Number(body.amount);
  const notes = (body.notes as string) || null;

  if (user_id !== user.id && user.role !== "admin") {
    return NextResponse.json(
      { error: "You can only settle your own balance." },
      { status: 403 },
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("settlements")
    .insert({ user_id, amount: Math.round(amount), notes })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user.id, "settlement_created", { settlement_id: data.id, user_id, amount });
  return NextResponse.json(data, { status: 201 });
}
