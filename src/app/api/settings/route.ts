import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireAdmin } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/pricing";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;
  const settings = await getSettings();
  return NextResponse.json(settings);
}

// Only admins can change prices. Historical records are untouched — prices are
// snapshotted onto each meal_record at insert time.
export async function PATCH(req: NextRequest) {
  const { user, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const patch: Partial<Record<"breakfast_price" | "dinner_price" | "egg_price", number>> = {};
  for (const key of ["breakfast_price", "dinner_price", "egg_price"] as const) {
    if (body[key] !== undefined) {
      const value = Number(body[key]);
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json({ error: `Invalid ${key}.` }, { status: 400 });
      }
      patch[key] = Math.round(value);
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const before = await getSettings();
  const { data, error } = await supabaseAdmin()
    .from("settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user.id, "price_changed", { before, after: data });
  return NextResponse.json(data);
}
