import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { User, UserSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Per-user aggregates. Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD filters the
 * meal/settlement window. With no range it returns the all-time position
 * (i.e. the amount currently owed).
 */
export async function GET(req: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const supabase = supabaseAdmin();

  let mealQuery = supabase
    .from("meal_records")
    .select("user_id, meal_type, egg_count, total_price");
  if (from) mealQuery = mealQuery.gte("meal_date", from);
  if (to) mealQuery = mealQuery.lte("meal_date", to);

  let settleQuery = supabase.from("settlements").select("user_id, amount, settled_at");
  if (from) settleQuery = settleQuery.gte("settled_at", from);
  if (to) settleQuery = settleQuery.lte("settled_at", `${to}T23:59:59.999Z`);

  // Run all three reads concurrently instead of awaiting them in series.
  const [usersRes, mealsRes, settlementsRes] = await Promise.all([
    supabase.from("users").select("id, name, role, active, created_at").order("name", { ascending: true }),
    mealQuery,
    settleQuery,
  ]);

  if (usersRes.error) return NextResponse.json({ error: usersRes.error.message }, { status: 500 });
  if (mealsRes.error) return NextResponse.json({ error: mealsRes.error.message }, { status: 500 });
  if (settlementsRes.error)
    return NextResponse.json({ error: settlementsRes.error.message }, { status: 500 });

  const users = usersRes.data;
  const meals = mealsRes.data;
  const settlements = settlementsRes.data;

  const summaries: UserSummary[] = (users ?? []).map((u) => {
    const userMeals = (meals ?? []).filter((m) => m.user_id === u.id);
    const breakfast_count = userMeals.filter((m) => m.meal_type === "breakfast").length;
    const dinner_count = userMeals.filter((m) => m.meal_type === "dinner").length;
    const egg_count = userMeals.reduce((sum, m) => sum + (m.egg_count as number), 0);
    const total_charged = userMeals.reduce((sum, m) => sum + (m.total_price as number), 0);
    const total_settled = (settlements ?? [])
      .filter((s) => s.user_id === u.id)
      .reduce((sum, s) => sum + (s.amount as number), 0);

    return {
      user: {
        id: u.id as string,
        name: u.name as string,
        role: u.role as User["role"],
        active: u.active as boolean,
        created_at: u.created_at as string,
      },
      total_meals: breakfast_count + dinner_count,
      breakfast_count,
      dinner_count,
      egg_count,
      total_charged,
      total_settled,
      balance: total_charged - total_settled,
    };
  });

  return NextResponse.json(summaries);
}
