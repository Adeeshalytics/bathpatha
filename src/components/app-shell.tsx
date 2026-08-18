"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { OfflineIndicator } from "./offline-indicator";
import { SyncManager } from "./sync-manager";
import { BottomNav } from "./bottom-nav";
import { LogoutButton } from "./logout-button";
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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setUser({ userId, name, role });
  }, [userId, name, role, setUser]);

  // The chef account is view-only. It may browse the read-only Reports and
  // Others (everyone's meals + amounts owed) screens, but is kept off the
  // meal-recording ("My history", dashboard) and admin pages.
  useEffect(() => {
    const chefAllowed = ["/reports", "/others"];
    if (role === "chef" && !chefAllowed.some((p) => pathname.startsWith(p))) {
      router.replace("/reports");
    }
  }, [role, pathname, router]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <SyncManager />
      {/* Persistent top bar — always offers a way to log out, for every role. */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-card/95 px-4 py-2.5 backdrop-blur">
        <span className="text-lg font-bold tracking-tight text-primary">බත්පත</span>
        <LogoutButton />
      </header>
      <OfflineIndicator />
      <main className="flex-1 px-4 pb-6 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
