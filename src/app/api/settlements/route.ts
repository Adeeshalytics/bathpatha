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
  // Optional payment date (YYYY-MM-DD). Defaults to now. Cannot be in the future.
  const settled_on = body.settled_on as string | undefined;

  if (user_id !== user.id && user.role !== "admin") {
    return NextResponse.json(
      { error: "You can only settle your own balance." },
      { status: 403 },
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero." }, { status: 400 });
  }

  let settled_at: string | undefined;
  if (settled_on) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(settled_on)) {
      return NextResponse.json({ error: "Invalid settlement date." }, { status: 400 });
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    // Record at local noon of the chosen day to avoid timezone drift across the date boundary.
    const ts = new Date(`${settled_on}T12:00:00`);
    if (ts.getTime() > today.getTime()) {
      return NextResponse.json({ error: "Settlement date cannot be in the future." }, { status: 400 });
    }
    settled_at = ts.toISOString();
  }

  const { data, error } = await supabaseAdmin()
    .from("settlements")
    .insert({
      user_id,
      amount: Math.round(amount),
      notes,
      ...(settled_at ? { settled_at } : {}),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user.id, "settlement_created", { settlement_id: data.id, user_id, amount, settled_at });
  return NextResponse.json(data, { status: 201 });
}
