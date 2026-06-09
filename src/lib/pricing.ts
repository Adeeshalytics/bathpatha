import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import type { MealType, Settings } from "./types";

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabaseAdmin()
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Settings not found");
  }
  return data as unknown as Settings;
}

export function mealUnitPrice(settings: Settings, type: MealType): number {
  return type === "breakfast" ? settings.breakfast_price : settings.dinner_price;
}

export function computeTotal(mealPrice: number, eggCount: number, eggPrice: number): number {
  return mealPrice + eggCount * eggPrice;
}
