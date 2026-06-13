"use client";

import { useMemo, useState } from "react";
import { HandCoins, CalendarPlus, NotebookPen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/activity-timeline";
import { SettleDialog } from "@/components/settle-dialog";
import { AddPastMealDialog } from "@/components/add-past-meal-dialog";
import { NotesDialog } from "@/components/notes-dialog";
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
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

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

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="h-auto min-h-11 flex-1 whitespace-normal py-2 text-center leading-tight"
          onClick={() => setAddMealOpen(true)}
        >
          <CalendarPlus className="h-4 w-4 shrink-0" /> පෙර දිනක කෑමක් · Add a meal I forgot
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => setNotesOpen(true)}
          aria-label="Notes"
        >
          <NotebookPen className="h-4 w-4" />
        </Button>
      </div>

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
        <>
          <SettleDialog
            open={settleOpen}
            onOpenChange={setSettleOpen}
            userId={userId}
            defaultAmount={me?.balance ?? 0}
          />
          <AddPastMealDialog
            open={addMealOpen}
            onOpenChange={setAddMealOpen}
            userId={userId}
            meals={meals ?? []}
          />
          <NotesDialog open={notesOpen} onOpenChange={setNotesOpen} userId={userId} />
        </>
      )}
    </div>
  );
}
