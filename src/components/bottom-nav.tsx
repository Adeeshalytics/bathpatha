"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Users, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/store/auth";

const items = [
  { href: "/dashboard", label: "මුල", labelEn: "Home", icon: Home },
  { href: "/history", label: "ඉතිහාසය", labelEn: "History", icon: History },
  { href: "/others", label: "අනෙක්", labelEn: "Others", icon: Users },
  { href: "/reports", label: "වාර්තා", labelEn: "Reports", icon: BarChart3, admin: true },
  { href: "/settings", label: "සැකසුම්", labelEn: "Settings", icon: Settings, admin: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();

  const visible = items.filter((i) => !i.admin || isAdmin);

  return (
    <nav className="sticky bottom-0 z-40 border-t bg-card/95 backdrop-blur pb-safe">
      <div className="mx-auto grid max-w-md grid-cols-[repeat(var(--cols),1fr)]" style={{ ["--cols" as string]: visible.length }}>
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
