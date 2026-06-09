"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { apiLogout } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const clear = useAuth((s) => s.clear);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Log out"
      onClick={async () => {
        await apiLogout().catch(() => {});
        clear();
        router.replace("/");
      }}
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
