"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { flushPendingMeals, countPendingMeals } from "@/lib/sync";
import { useOffline } from "@/store/offline";

/**
 * Background sync: flushes locally-queued meals whenever the app loads or the
 * connection is restored, then refreshes server data.
 */
export function SyncManager() {
  const qc = useQueryClient();
  const setPendingCount = useOffline((s) => s.setPendingCount);
  const setSyncing = useOffline((s) => s.setSyncing);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      setSyncing(true);
      try {
        const synced = await flushPendingMeals();
        if (cancelled) return;
        if (synced > 0) {
          qc.invalidateQueries({ queryKey: ["summaries"] });
          qc.invalidateQueries({ queryKey: ["meals"] });
          toast.success(`${synced} offline ${synced === 1 ? "entry" : "entries"} synced.`);
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
          setPendingCount(await countPendingMeals());
        }
      }
    };

    void run();
    window.addEventListener("online", run);
    const interval = window.setInterval(run, 30_000);

    // seed the indicator on first mount
    countPendingMeals().then((n) => !cancelled && setPendingCount(n));

    return () => {
      cancelled = true;
      window.removeEventListener("online", run);
      window.clearInterval(interval);
    };
  }, [qc, setPendingCount, setSyncing]);

  return null;
}
