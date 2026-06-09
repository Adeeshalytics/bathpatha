import { create } from "zustand";

interface OfflineState {
  pendingCount: number;
  syncing: boolean;
  setPendingCount: (n: number) => void;
  setSyncing: (b: boolean) => void;
}

export const useOffline = create<OfflineState>((set) => ({
  pendingCount: 0,
  syncing: false,
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setSyncing: (syncing) => set({ syncing }),
}));
