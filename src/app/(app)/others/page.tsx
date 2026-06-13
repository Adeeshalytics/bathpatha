"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { useSummaries } from "@/lib/queries";
import { formatRs } from "@/lib/utils";

export default function OthersPage() {
  const { data: summaries, isLoading } = useSummaries();

  const grandTotal = (summaries ?? []).reduce((s, u) => s + u.balance, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">අනෙක් අය · Everyone</h1>

      <Card className="bg-accent text-accent-foreground">
        <CardContent className="flex items-center justify-between p-5">
          <span className="text-sm opacity-90">මුළු හිඟ මුදල · Total owed (all)</span>
          <span className="text-2xl font-bold">{formatRs(grandTotal)}</span>
        </CardContent>
      </Card>

      {isLoading && <p className="py-8 text-center text-muted-foreground">Loading…</p>}

      <div className="space-y-2">
        {summaries?.map((s) => (
          <Link key={s.user.id} href={`/others/${s.user.id}`}>
            <Card className="transition-colors hover:border-primary">
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar name={s.user.name} className="h-11 w-11" textClassName="font-semibold" />
                <div className="flex-1">
                  <p className="flex items-center gap-1.5 font-semibold">
                    {s.user.name}
                    {s.user.role === "admin" && <ShieldCheck className="h-3.5 w-3.5 text-accent" />}
                    {!s.user.active && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        disabled
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.total_meals} meals · {s.egg_count} eggs
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatRs(s.balance)}</p>
                  <p className="text-[11px] text-muted-foreground">owed</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
