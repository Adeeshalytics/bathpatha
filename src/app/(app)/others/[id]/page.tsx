"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, HandCoins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/activity-timeline";
import { SettleDialog } from "@/components/settle-dialog";
import { useMeals, useSettlements, useSummaries } from "@/lib/queries";
import { useAuth, useIsAdmin } from "@/store/auth";
import { formatRs } from "@/lib/utils";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const isAdmin = useIsAdmin();
  const currentUserId = useAuth((s) => s.userId);
  const isSelf = currentUserId === userId;

  const { data: summaries } = useSummaries();
  const { data: meals } = useMeals(userId);
  const { data: settlements } = useSettlements(userId);

  const summary = useMemo(
    () => summaries?.find((s) => s.user.id === userId),
    [summaries, userId],
  );

  const [settleOpen, setSettleOpen] = useState(false);

  return (
    <div className="space-y-5">
      <Link href="/others" className="flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Everyone
      </Link>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-5">
          <h1 className="text-xl font-bold">{summary?.user.name ?? "…"}</h1>
          <p className="mt-2 text-sm opacity-90">ගෙවිය යුතු මුදල · Owed</p>
          <p className="text-3xl font-bold">{summary ? formatRs(summary.balance) : "—"}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-white/15 py-2">
              <p className="text-lg font-bold">{summary?.breakfast_count ?? 0}</p>
              <p className="text-[11px] opacity-90">Breakfast</p>
            </div>
            <div className="rounded-xl bg-white/15 py-2">
              <p className="text-lg font-bold">{summary?.dinner_count ?? 0}</p>
              <p className="text-[11px] opacity-90">Dinner</p>
            </div>
            <div className="rounded-xl bg-white/15 py-2">
              <p className="text-lg font-bold">{summary?.egg_count ?? 0}</p>
              <p className="text-[11px] opacity-90">Eggs</p>
            </div>
          </div>
          <p className="mt-3 text-xs opacity-80">
            Charged {formatRs(summary?.total_charged ?? 0)} · Settled{" "}
            {formatRs(summary?.total_settled ?? 0)}
          </p>
        </CardContent>
      </Card>

      {(isAdmin || isSelf) && (
        <Button size="lg" className="w-full" onClick={() => setSettleOpen(true)}>
          <HandCoins className="h-5 w-5" /> Record payment · ගෙවීම සටහන් කරන්න
        </Button>
      )}

      {/* Combined meal + settlement history — visible to everyone */}
      <div>
        <p className="mb-2 text-sm font-semibold text-muted-foreground">Activity</p>
        <ActivityTimeline
          meals={meals ?? []}
          settlements={settlements ?? []}
          canEditMeal={() => isAdmin}
          canDeleteSettlement={() => isAdmin}
        />
      </div>

      <SettleDialog
        open={settleOpen}
        onOpenChange={setSettleOpen}
        userId={userId}
        userName={isSelf ? undefined : summary?.user.name}
        defaultAmount={summary?.balance ?? 0}
      />
    </div>
  );
}
