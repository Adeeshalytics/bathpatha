"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Coffee, Moon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateMeal } from "@/lib/queries";
import { cn, localDateString } from "@/lib/utils";
import type { MealRecord, MealType } from "@/lib/types";

const EGG_OPTIONS = [0, 1, 2, 3, 4];

/**
 * Lets a user record a meal they forgot to mark, for one of the last 3 calendar
 * days (today / yesterday / day before). Days where the meal already exists are
 * blocked, and the server independently enforces the same recency window.
 */
export function AddPastMealDialog({
  open,
  onOpenChange,
  userId,
  meals,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  meals: MealRecord[];
}) {
  const createMeal = useCreateMeal();

  const days = useMemo(() => {
    const arr: { date: string; label: string; sub: string }[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push({
        date: localDateString(d),
        label: i === 0 ? "Today" : i === 1 ? "Yesterday" : format(d, "EEEE"),
        sub: format(d, "dd MMM"),
      });
    }
    return arr;
  }, []);

  const [date, setDate] = useState(days[1].date); // default: yesterday
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [eggs, setEggs] = useState(0);

  useEffect(() => {
    if (open) {
      setDate(days[1].date);
      setMealType("breakfast");
      setEggs(0);
    }
  }, [open, days]);

  const alreadyRecorded = meals.some((m) => m.meal_date === date && m.meal_type === mealType);

  const submit = () => {
    createMeal.mutate(
      { meal_type: mealType, egg_count: eggs, meal_date: date, user_id: userId },
      {
        onSuccess: (res) => {
          onOpenChange(false);
          if ("queued" in res && res.queued) {
            toast.success("Saved offline — will sync when online.");
          } else {
            toast.success("Meal added.");
          }
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add meal."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>අමතක වූ කෑමක් · Add a meal I forgot</DialogTitle>
          <DialogDescription>Only the last 2 days can be added.</DialogDescription>
        </DialogHeader>

        {/* Day */}
        <div className="grid grid-cols-3 gap-2">
          {days.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => setDate(d.date)}
              className={cn(
                "flex flex-col items-center rounded-2xl border py-3 transition-colors",
                date === d.date
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card",
              )}
            >
              <span className="text-sm font-semibold">{d.label}</span>
              <span
                className={cn(
                  "text-xs",
                  date === d.date ? "opacity-90" : "text-muted-foreground",
                )}
              >
                {d.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Meal type */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMealType("breakfast")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl border py-3 font-semibold transition-colors",
              mealType === "breakfast"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card",
            )}
          >
            <Coffee className="h-5 w-5" /> Breakfast
          </button>
          <button
            type="button"
            onClick={() => setMealType("dinner")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl border py-3 font-semibold transition-colors",
              mealType === "dinner"
                ? "border-accent bg-accent text-accent-foreground"
                : "border-input bg-card",
            )}
          >
            <Moon className="h-5 w-5" /> Dinner
          </button>
        </div>

        {/* Eggs */}
        <div>
          <p className="mb-2 text-sm text-muted-foreground">බිත්තර කීයක්ද? · How many eggs?</p>
          <div className="grid grid-cols-5 gap-2">
            {EGG_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEggs(n)}
                className={cn(
                  "flex h-14 items-center justify-center rounded-2xl border text-xl font-bold transition-colors",
                  eggs === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {alreadyRecorded && (
          <p className="text-center text-sm font-medium text-destructive">
            {mealType === "breakfast" ? "Breakfast" : "Dinner"} is already recorded for that day.
          </p>
        )}

        <Button
          size="lg"
          className="w-full"
          disabled={createMeal.isPending || alreadyRecorded}
          onClick={submit}
        >
          {createMeal.isPending ? "Saving…" : "Add meal"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
