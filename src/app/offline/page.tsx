import { CloudOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <CloudOff className="h-14 w-14 text-muted-foreground" />
      <h1 className="text-2xl font-bold">ඔබ offline · You&apos;re offline</h1>
      <p className="text-muted-foreground">
        This page hasn&apos;t been cached yet. Any meals you record are saved on this device and
        will sync automatically when you&apos;re back online.
      </p>
    </div>
  );
}
