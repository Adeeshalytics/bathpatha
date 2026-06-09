"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  apiAddUser,
  apiAuditLogs,
  apiCreateMeal,
  apiCreateSettlement,
  apiDeleteMeal,
  apiDeleteSettlement,
  apiGetSettings,
  apiListMeals,
  apiListSettlements,
  apiSummaries,
  apiUpdateMeal,
  apiUpdateSettings,
  apiUpdateUser,
} from "./api";
import { queuePendingMeal, countPendingMeals } from "./offline-db";
import { useOffline } from "@/store/offline";
import type { MealType } from "./types";

export const qk = {
  summaries: (from?: string, to?: string) => ["summaries", from ?? null, to ?? null] as const,
  meals: (userId?: string) => ["meals", userId ?? "all"] as const,
  settlements: (userId?: string) => ["settlements", userId ?? "all"] as const,
  settings: ["settings"] as const,
  audit: ["audit"] as const,
};

function invalidateMealData(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["summaries"] });
  qc.invalidateQueries({ queryKey: ["meals"] });
}

// ---- queries ----
export function useSummaries(from?: string, to?: string) {
  return useQuery({ queryKey: qk.summaries(from, to), queryFn: () => apiSummaries(from, to) });
}

export function useMeals(userId?: string) {
  return useQuery({ queryKey: qk.meals(userId), queryFn: () => apiListMeals(userId) });
}

export function useSettlements(userId?: string) {
  return useQuery({ queryKey: qk.settlements(userId), queryFn: () => apiListSettlements(userId) });
}

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: apiGetSettings });
}

export function useAuditLogs() {
  return useQuery({ queryKey: qk.audit, queryFn: apiAuditLogs });
}

// ---- meal mutations (offline-aware) ----
export function useCreateMeal() {
  const qc = useQueryClient();
  const setPendingCount = useOffline((s) => s.setPendingCount);

  return useMutation({
    mutationFn: async (input: {
      meal_type: MealType;
      egg_count: number;
      meal_date: string;
      user_id?: string;
    }) => {
      const queueLocally = async () => {
        await queuePendingMeal({
          localId: crypto.randomUUID(),
          user_id: input.user_id ?? "self",
          meal_type: input.meal_type,
          egg_count: input.egg_count,
          meal_date: input.meal_date,
          created_at: new Date().toISOString(),
        });
        setPendingCount(await countPendingMeals());
        return { queued: true as const };
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return queueLocally();
      }

      try {
        const record = await apiCreateMeal(input);
        return { queued: false as const, record };
      } catch (err) {
        // A thrown TypeError means the request never reached the server →
        // treat as offline and queue. Validation/409 errors are rethrown.
        if (err instanceof TypeError) return queueLocally();
        throw err;
      }
    },
    onSuccess: () => invalidateMealData(qc),
  });
}

export function useUpdateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; meal_type?: MealType; egg_count?: number }) =>
      apiUpdateMeal(vars.id, { meal_type: vars.meal_type, egg_count: vars.egg_count }),
    onSuccess: () => invalidateMealData(qc),
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteMeal(id),
    onSuccess: () => invalidateMealData(qc),
  });
}

// ---- settlements ----
export function useSettle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { user_id: string; amount: number; notes?: string }) =>
      apiCreateSettlement(vars),
    onSuccess: () => {
      invalidateMealData(qc);
      qc.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}

export function useDeleteSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteSettlement(id),
    onSuccess: () => {
      invalidateMealData(qc);
      qc.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}

// ---- settings ----
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: apiUpdateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.settings }),
  });
}

// ---- admin users ----
export function useAddUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: apiAddUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["summaries"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      active?: boolean;
      role?: "admin" | "user";
      reset_pin?: boolean;
    }) => apiUpdateUser(vars.id, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["summaries"] }),
  });
}
