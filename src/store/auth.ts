import { create } from "zustand";
import type { Role } from "@/lib/types";

interface AuthState {
  userId: string | null;
  name: string | null;
  role: Role | null;
  setUser: (user: { userId: string; name: string; role: Role }) => void;
  clear: () => void;
}

/**
 * Lightweight client mirror of the session. The authoritative session lives in
 * the httpOnly cookie; this store just lets client components know who "me" is.
 */
export const useAuth = create<AuthState>((set) => ({
  userId: null,
  name: null,
  role: null,
  setUser: ({ userId, name, role }) => set({ userId, name, role }),
  clear: () => set({ userId: null, name: null, role: null }),
}));

export const useIsAdmin = () => useAuth((s) => s.role === "admin");

/** True for the view-only chef account (e.g. Aunty). */
export const useIsChef = () => useAuth((s) => s.role === "chef");

/** Who may open the Reports screen: admins and the view-only chef. */
export const useCanViewReports = () =>
  useAuth((s) => s.role === "admin" || s.role === "chef");
