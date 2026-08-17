import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeTotal, getSettings, mealUnitPrice } from "@/lib/pricing";
import { logAudit } from "@/lib/audit";
import { isWithinEditWindow } from "@/lib/utils";
import type { MealRecord, MealType } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadRecord(id: string): Promise<MealRecord | null> {
  const { data } = await supabaseAdmin()
    .from("meal_records")
    .select("*")
    .eq("id", id)
    .single();
  return (data as MealRecord) ?? null;
}

/**
 * Permission: admins may edit any record. Normal users may edit only their own
 * records, and only within 48 hours of creation.
 */
function canEdit(
  user: { id: string; role: string },
  record: MealRecord,
): { ok: true } | { ok: false; status: number; error: string } {
  if (user.role === "admin") return { ok: true };
  if (user.role === "chef") {
    return { ok: false, status: 403, error: "This account is view-only." };
  }
  if (record.user_id !== user.id) {
    return { ok: false, status: 403, error: "You can only edit your own meals." };
  }
  if (!isWithinEditWindow(record.created_at)) {
    return { ok: false, status: 403, error: "This entry is older than 48 hours and is read-only." };
  }
  return { ok: true };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const record = await loadRecord(id);
  if (!record) return NextResponse.json({ error: "Meal not found." }, { status: 404 });

  const permission = canEdit(user, record);
  if (!permission.ok) {
    return NextResponse.json({ error: permission.error }, { status: permission.status });
  }

  const body = await req.json().catch(() => ({}));
  const nextEggCount =
    body.egg_count === undefined ? record.egg_count : Number(body.egg_count);
  const nextMealType: MealType =
    body.meal_type === undefined ? record.meal_type : (body.meal_type as MealType);

  if (!Number.isInteger(nextEggCount) || nextEggCount < 0) {
    return NextResponse.json({ error: "Egg count cannot be negative." }, { status: 400 });
  }
  if (nextMealType !== "breakfast" && nextMealType !== "dinner") {
    return NextResponse.json({ error: "Invalid meal type." }, { status: 400 });
  }

  // Preserve the historical meal price unless the meal type itself changed,
  // in which case snapshot the current price for the new type.
  let mealPrice = record.meal_price;
  if (nextMealType !== record.meal_type) {
    const settings = await getSettings();
    mealPrice = mealUnitPrice(settings, nextMealType);
  }
  const total = computeTotal(mealPrice, nextEggCount, record.egg_price);

  const { data, error } = await supabaseAdmin()
    .from("meal_records")
    .update({
      meal_type: nextMealType,
      meal_price: mealPrice,
      egg_count: nextEggCount,
      total_price: total,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Another entry of that meal already exists for this day." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(user.id, "meal_edited", { meal_id: id, changes: body });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const record = await loadRecord(id);
  if (!record) return NextResponse.json({ error: "Meal not found." }, { status: 404 });

  const permission = canEdit(user, record);
  if (!permission.ok) {
    return NextResponse.json({ error: permission.error }, { status: permission.status });
  }

  const { error } = await supabaseAdmin().from("meal_records").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user.id, "meal_deleted", { meal_id: id, record });
  return new NextResponse(null, { status: 204 });
}
