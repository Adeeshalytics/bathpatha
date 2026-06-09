"use client";

import { useEffect } from "react";
import { OfflineIndicator } from "./offline-indicator";
import { SyncManager } from "./sync-manager";
import { BottomNav } from "./bottom-nav";
import { useAuth } from "@/store/auth";
import type { Role } from "@/lib/types";

export function AppShell({
  userId,
  name,
  role,
  children,
}: {
  userId: string;
  name: string;
  role: Role;
  children: React.ReactNode;
}) {
  const setUser = useAuth((s) => s.setUser);

  useEffect(() => {
    setUser({ userId, name, role });
  }, [userId, name, role, setUser]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <SyncManager />
      <OfflineIndicator />
      <main className="flex-1 px-4 pb-6 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
