"use client";

import { apiCreateMeal } from "./api";
import { getPendingMeals, removePendingMeal, countPendingMeals } from "./offline-db";

let inFlight = false;

/**
 * Push all locally-queued meals to the server.
 * - On success: remove from the queue.
 * - On 409 (meal already recorded that day): drop it — the server copy wins
 *   ("latest update wins" / no duplicates).
 * - On any other error (e.g. still offline): keep it for the next attempt.
 * Returns the number of entries successfully synced.
 */
export async function flushPendingMeals(): Promise<number> {
  if (inFlight) return 0;
  inFlight = true;
  let synced = 0;
  try {
    const pending = await getPendingMeals();
    for (const meal of pending) {
      try {
        await apiCreateMeal({
          meal_type: meal.meal_type,
          egg_count: meal.egg_count,
          meal_date: meal.meal_date,
          user_id: meal.user_id,
        });
        await removePendingMeal(meal.localId);
        synced += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (/already recorded|already exists/i.test(message)) {
          await removePendingMeal(meal.localId);
        } else {
          // Network/server error — stop and retry the whole batch later.
          break;
        }
      }
    }
  } finally {
    inFlight = false;
  }
  return synced;
}

export { countPendingMeals };
