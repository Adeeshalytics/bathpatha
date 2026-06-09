"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { useOnline } from "@/hooks/use-online";
import { useOffline } from "@/store/offline";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const online = useOnline();
  const pending = useOffline((s) => s.pendingCount);
  const syncing = useOffline((s) => s.syncing);

  if (online && pending === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-medium",
        online ? "bg-accent/15 text-accent" : "bg-amber-500/15 text-amber-700",
      )}
    >
      {online ? (
        <>
          <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
          {pending} pending — syncing…
        </>
      ) : (
        <>
          <CloudOff className="h-3.5 w-3.5" />
          Offline mode{pending > 0 ? ` · ${pending} pending` : ""} — entries are saved on this device
        </>
      )}
    </div>
  );
}
