// =====================================================================
//  Shared domain types
// =====================================================================

export type Role = "admin" | "user";
export type MealType = "breakfast" | "dinner";

export type AuditAction =
  | "meal_added"
  | "meal_edited"
  | "meal_deleted"
  | "settlement_created"
  | "settlement_deleted"
  | "price_changed"
  | "user_added"
  | "user_disabled"
  | "user_enabled"
  | "pin_reset";

export interface User {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  created_at: string;
  /** true once the user has set a PIN; pin_hash itself is never sent to the client */
  has_pin?: boolean;
}

export interface MealRecord {
  id: string;
  user_id: string;
  meal_type: MealType;
  meal_price: number;
  egg_count: number;
  egg_price: number;
  total_price: number;
  meal_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface Settlement {
  id: string;
  user_id: string;
  amount: number;
  settled_at: string;
  notes: string | null;
}

export interface Settings {
  id: number;
  breakfast_price: number;
  dinner_price: number;
  egg_price: number;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  details: Record<string, unknown> | null;
  created_at: string;
}

/** Aggregated per-user financial position. */
export interface UserSummary {
  user: User;
  total_meals: number;
  breakfast_count: number;
  dinner_count: number;
  egg_count: number;
  total_charged: number; // sum of all meal totals, all-time
  total_settled: number; // sum of all settlements
  balance: number; // total_charged - total_settled = currently owed
}

/** The authenticated session payload stored in the signed cookie. */
export interface Session {
  userId: string;
  name: string;
  role: Role;
}

/** A meal entry queued locally while offline, awaiting sync. */
export interface PendingMeal {
  localId: string;
  user_id: string;
  meal_type: MealType;
  egg_count: number;
  meal_date: string;
  created_at: string;
}
