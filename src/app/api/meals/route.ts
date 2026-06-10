import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeTotal, getSettings, mealUnitPrice } from "@/lib/pricing";
import { logAudit } from "@/lib/audit";
import { localDateString } from "@/lib/utils";
import type { MealType } from "@/lib/types";

export const dynamic = "force-dynamic";

// List meals — all users may view everyone's history.
export async function GET(req: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const userId = req.nextUrl.searchParams.get("userId");
  let query = supabaseAdmin()
    .from("meal_records")
    .select("*")
    .order("meal_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Create a meal record.
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const meal_type = body.meal_type as MealType;
  const egg_count = Number(body.egg_count ?? 0);
  const meal_date = (body.meal_date as string) || localDateString();
  const targetUserId = (body.user_id as string) || user.id;

  if (meal_type !== "breakfast" && meal_type !== "dinner") {
    return NextResponse.json({ error: "Invalid meal type." }, { status: 400 });
  }
  if (!Number.isInteger(egg_count) || egg_count < 0) {
    return NextResponse.json({ error: "Egg count cannot be negative." }, { status: 400 });
  }
  // Only admins may record meals for other users.
  if (targetUserId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "You can only record your own meals." }, { status: 403 });
  }

  // Non-admins may only record meals for the recent past (forgot-to-mark window)
  // and never the future. Admins can backdate freely. The bounds are widened by
  // a day on each side to absorb server/client timezone skew (the UI enforces
  // the exact "today, yesterday, day-before" set).
  if (user.role !== "admin") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meal_date)) {
      return NextResponse.json({ error: "Invalid meal date." }, { status: 400 });
    }
    const dayMs = 24 * 60 * 60 * 1000;
    const target = new Date(`${meal_date}T00:00:00Z`).getTime();
    const todayUtc = new Date(`${localDateString()}T00:00:00Z`).getTime();
    const diffDays = Math.round((target - todayUtc) / dayMs);
    if (diffDays > 1) {
      return NextResponse.json({ error: "You cannot record a meal in the future." }, { status: 400 });
    }
    if (diffDays < -3) {
      return NextResponse.json(
        { error: "You can only add a forgotten meal from the last 2 days." },
        { status: 400 },
      );
    }
  }

  const settings = await getSettings();
  const meal_price = mealUnitPrice(settings, meal_type);
  const egg_price = settings.egg_price;
  const total_price = computeTotal(meal_price, egg_count, egg_price);

  const { data, error } = await supabaseAdmin()
    .from("meal_records")
    .insert({
      user_id: targetUserId,
      meal_type,
      meal_price,
      egg_count,
      egg_price,
      total_price,
      meal_date,
    })
    .select("*")
    .single();

  if (error) {
    // Unique violation → already recorded this meal today.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `${meal_type === "breakfast" ? "Breakfast" : "Dinner"} already recorded for this day.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(user.id, "meal_added", {
    meal_id: data.id,
    for_user: targetUserId,
    meal_type,
    egg_count,
    total_price,
    meal_date,
  });

  return NextResponse.json(data, { status: 201 });
}
