"use client";

import { useMemo, useState } from "react";
import { HandCoins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/activity-timeline";
import { SettleDialog } from "@/components/settle-dialog";
import { useAuth, useIsAdmin } from "@/store/auth";
import { useMeals, useSettlements, useSummaries } from "@/lib/queries";
import { formatRs, isWithinEditWindow } from "@/lib/utils";
import type { MealRecord } from "@/lib/types";

export default function HistoryPage() {
  const userId = useAuth((s) => s.userId);
  const isAdmin = useIsAdmin();
  const { data: meals, isLoading } = useMeals(userId ?? undefined, !!userId);
  const { data: settlements } = useSettlements(userId ?? undefined, !!userId);
  const { data: summaries } = useSummaries();
  const [settleOpen, setSettleOpen] = useState(false);

  const me = useMemo(() => summaries?.find((s) => s.user.id === userId), [summaries, userId]);

  const canEditMeal = (m: MealRecord) =>
    isAdmin || (m.user_id === userId && isWithinEditWindow(m.created_at));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ඉතිහාසය · My history</h1>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm opacity-90">ගෙවිය යුතු මුදල · You owe</p>
            <p className="text-2xl font-bold">{me ? formatRs(me.balance) : "—"}</p>
          </div>
          <Button variant="secondary" onClick={() => setSettleOpen(true)}>
            <HandCoins className="h-4 w-4" /> Record payment
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Meals can be edited within 48 hours of being recorded.
      </p>

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Loading…</p>
      ) : (
        <ActivityTimeline
          meals={meals ?? []}
          settlements={settlements ?? []}
          canEditMeal={canEditMeal}
          canDeleteSettlement={() => isAdmin}
        />
      )}

      {userId && (
        <SettleDialog
          open={settleOpen}
          onOpenChange={setSettleOpen}
          userId={userId}
          defaultAmount={me?.balance ?? 0}
        />
      )}
    </div>
  );
}
