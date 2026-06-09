"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Coffee, Moon, Egg, Pencil, Trash2, HandCoins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EggPicker } from "@/components/egg-picker";
import { useDeleteMeal, useDeleteSettlement, useUpdateMeal } from "@/lib/queries";
import { formatRs, localDateString } from "@/lib/utils";
import type { MealRecord, Settlement } from "@/lib/types";

type Item =
  | { kind: "meal"; date: string; ts: number; meal: MealRecord }
  | { kind: "settlement"; date: string; ts: number; settlement: Settlement };

/**
 * A combined, read-for-everyone history of a user's meal charges and
 * settlement payments, grouped by day (newest first).
 */
export function ActivityTimeline({
  meals,
  settlements,
  canEditMeal,
  canDeleteSettlement = () => false,
}: {
  meals: MealRecord[];
  settlements: Settlement[];
  canEditMeal: (m: MealRecord) => boolean;
  canDeleteSettlement?: (s: Settlement) => boolean;
}) {
  const [editing, setEditing] = useState<MealRecord | null>(null);
  const [deletingMeal, setDeletingMeal] = useState<MealRecord | null>(null);
  const [deletingSettlement, setDeletingSettlement] = useState<Settlement | null>(null);
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();
  const deleteSettlement = useDeleteSettlement();

  const groups = useMemo(() => {
    const items: Item[] = [
      ...meals.map<Item>((m) => ({
        kind: "meal",
        date: m.meal_date,
        ts: new Date(m.created_at).getTime(),
        meal: m,
      })),
      ...settlements.map<Item>((s) => ({
        kind: "settlement",
        date: localDateString(new Date(s.settled_at)),
        ts: new Date(s.settled_at).getTime(),
        settlement: s,
      })),
    ];

    const map = new Map<string, Item[]>();
    for (const it of items) {
      const list = map.get(it.date) ?? [];
      list.push(it);
      map.set(it.date, list);
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // newest day first
      .map(([date, list]) => [date, list.sort((a, b) => b.ts - a.ts)] as const);
  }, [meals, settlements]);

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          තවම ක්‍රියාකාරකම් නැත · No activity yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map(([date, items]) => (
        <div key={date} className="space-y-2">
          <p className="px-1 text-sm font-semibold text-muted-foreground">
            {format(new Date(`${date}T00:00:00`), "dd MMM yyyy")}
          </p>

          {items.map((it) =>
            it.kind === "meal" ? (
              <Card key={`m-${it.meal.id}`}>
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {it.meal.meal_type === "breakfast" ? (
                      <Coffee className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold capitalize">{it.meal.meal_type}</p>
                    {it.meal.egg_count > 0 && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Egg className="h-3 w-3" /> {it.meal.egg_count} egg
                        {it.meal.egg_count > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <span className="font-bold">{formatRs(it.meal.total_price)}</span>
                  {canEditMeal(it.meal) && (
                    <div className="flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditing(it.meal)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeletingMeal(it.meal)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card key={`s-${it.settlement.id}`} className="border-accent/40 bg-accent/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <HandCoins className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-accent">Payment</p>
                    {it.settlement.notes && (
                      <p className="text-xs text-muted-foreground">{it.settlement.notes}</p>
                    )}
                  </div>
                  <span className="font-bold text-accent">− {formatRs(it.settlement.amount)}</span>
                  {canDeleteSettlement(it.settlement) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeletingSettlement(it.settlement)}
                      aria-label="Delete settlement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ),
          )}
        </div>
      ))}

      {/* Edit meal eggs */}
      {editing && (
        <EggPicker
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          mealLabel={`Edit ${editing.meal_type} · eggs`}
          initial={editing.egg_count}
          confirmLabel="Save changes"
          submitting={updateMeal.isPending}
          onConfirm={(eggs) =>
            updateMeal.mutate(
              { id: editing.id, egg_count: eggs },
              {
                onSuccess: () => {
                  toast.success("Meal updated.");
                  setEditing(null);
                },
                onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
              },
            )
          }
        />
      )}

      {/* Delete meal */}
      <Dialog open={!!deletingMeal} onOpenChange={(open) => !open && setDeletingMeal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this meal?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deletingMeal && `${deletingMeal.meal_type} · ${formatRs(deletingMeal.total_price)}`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingMeal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMeal.isPending}
              onClick={() =>
                deletingMeal &&
                deleteMeal.mutate(deletingMeal.id, {
                  onSuccess: () => {
                    toast.success("Meal deleted.");
                    setDeletingMeal(null);
                  },
                  onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
                })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete settlement (admin) */}
      <Dialog
        open={!!deletingSettlement}
        onOpenChange={(open) => !open && setDeletingSettlement(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this payment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deletingSettlement && `Payment of ${formatRs(deletingSettlement.amount)} will be removed.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSettlement(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteSettlement.isPending}
              onClick={() =>
                deletingSettlement &&
                deleteSettlement.mutate(deletingSettlement.id, {
                  onSuccess: () => {
                    toast.success("Payment deleted.");
                    setDeletingSettlement(null);
                  },
                  onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
                })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
