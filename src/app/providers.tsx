"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, keepPreviousData } from "@tanstack/react-query";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache is shared app-wide, so navigating between tabs reuses data
            // and doesn't refetch on every mount.
            // Within 60s, navigating between tabs reuses cache (no refetch).
            // After that, a mount refetches in the background automatically.
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            // Keep showing the last result while a new (e.g. date-filtered)
            // query loads — no blank flashes.
            placeholderData: keepPreviousData,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
