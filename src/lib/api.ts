// =====================================================================
//  Thin client-side fetch wrapper around the app's API routes.
// =====================================================================
import type {
  AuditLog,
  MealRecord,
  Settings,
  Settlement,
  User,
  UserSummary,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- auth ----
export const apiListUsers = () => request<User[]>("/api/users");
export const apiLogin = (userId: string, pin: string) =>
  request<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ userId, pin }),
  });
export const apiLogout = () => request<void>("/api/auth/logout", { method: "POST" });
export const apiMe = () => request<{ user: User } | { user: null }>("/api/auth/me");

// ---- meals ----
export const apiCreateMeal = (input: {
  meal_type: "breakfast" | "dinner";
  egg_count: number;
  meal_date: string;
  user_id?: string;
}) =>
  request<MealRecord>("/api/meals", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const apiListMeals = (userId?: string) =>
  request<MealRecord[]>(`/api/meals${userId ? `?userId=${userId}` : ""}`);

export const apiUpdateMeal = (
  id: string,
  input: { meal_type?: "breakfast" | "dinner"; egg_count?: number },
) =>
  request<MealRecord>(`/api/meals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const apiDeleteMeal = (id: string) =>
  request<void>(`/api/meals/${id}`, { method: "DELETE" });

// ---- summaries / reports ----
export const apiSummaries = (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return request<UserSummary[]>(`/api/summaries${qs ? `?${qs}` : ""}`);
};

// ---- settlements ----
export const apiCreateSettlement = (input: {
  user_id: string;
  amount: number;
  notes?: string;
  settled_on?: string;
}) =>
  request<Settlement>("/api/settlements", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const apiListSettlements = (userId?: string) =>
  request<Settlement[]>(`/api/settlements${userId ? `?userId=${userId}` : ""}`);

export const apiDeleteSettlement = (id: string) =>
  request<void>(`/api/settlements/${id}`, { method: "DELETE" });

// ---- settings ----
export const apiGetSettings = () => request<Settings>("/api/settings");
export const apiUpdateSettings = (input: Partial<Settings>) =>
  request<Settings>("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });

// ---- admin: users ----
export const apiAddUser = (input: { name: string; role: "admin" | "user" | "chef" }) =>
  request<User>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const apiUpdateUser = (
  id: string,
  input: { active?: boolean; role?: "admin" | "user" | "chef"; reset_pin?: boolean },
) =>
  request<User>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

// ---- audit ----
export const apiAuditLogs = () => request<AuditLog[]>("/api/admin/audit");
