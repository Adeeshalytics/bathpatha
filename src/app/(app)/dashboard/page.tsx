"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Coffee, Moon, Egg, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EggPicker } from "@/components/egg-picker";
import { useAuth } from "@/store/auth";
import { useCreateMeal, useMeals, useSummaries } from "@/lib/queries";
import { formatRs, localDateString } from "@/lib/utils";
import type { MealRecord, MealType } from "@/lib/types";

export default function DashboardPage() {
  const userId = useAuth((s) => s.userId);
  const name = useAuth((s) => s.name);
  const today = localDateString();

  const { data: summaries } = useSummaries();
  const { data: meals } = useMeals(userId ?? undefined, !!userId);
  const createMeal = useCreateMeal();

  const [picker, setPicker] = useState<MealType | null>(null);
  const [datesFor, setDatesFor] = useState<MealType | null>(null);

  const me = useMemo(
    () => summaries?.find((s) => s.user.id === userId),
    [summaries, userId],
  );

  const datesList = useMemo(
    () =>
      datesFor
        ? (meals ?? [])
            .filter((m) => m.meal_type === datesFor)
            .sort((a, b) => (a.meal_date < b.meal_date ? 1 : -1))
        : [],
    [meals, datesFor],
  );

  const todaysMeals = useMemo(
    () => (meals ?? []).filter((m) => m.meal_date === today),
    [meals, today],
  );
  const todaysBreakfast = todaysMeals.find((m) => m.meal_type === "breakfast");
  const todaysDinner = todaysMeals.find((m) => m.meal_type === "dinner");
  const todaysEggs = todaysMeals.reduce((s, m) => s + m.egg_count, 0);
  const todaysTotal = todaysMeals.reduce((s, m) => s + m.total_price, 0);

  const handleConfirm = (eggCount: number) => {
    const meal_type = picker!;
    createMeal.mutate(
      { meal_type, egg_count: eggCount, meal_date: today, user_id: userId ?? undefined },
      {
        onSuccess: (res) => {
          setPicker(null);
          if ("queued" in res && res.queued) {
            toast.success("Saved offline — will sync when online.");
          } else {
            toast.success(`${meal_type === "breakfast" ? "Breakfast" : "Dinner"} recorded.`);
          }
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Could not save meal.");
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">ආයුබෝවන් · Hello</p>
        <h1 className="text-2xl font-bold">{name ?? "…"}</h1>
      </div>

      {/* Current user card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-5">
          <p className="text-sm opacity-90">ගෙවිය යුතු මුළු මුදල · Total owed</p>
          <p className="text-4xl font-bold tracking-tight">
            {me ? formatRs(me.balance) : "Rs. 0"}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniStat
              label="Breakfast"
              value={me?.breakfast_count ?? 0}
              onClick={() => setDatesFor("breakfast")}
            />
            <MiniStat
              label="Dinner"
              value={me?.dinner_count ?? 0}
              onClick={() => setDatesFor("dinner")}
            />
            <MiniStat label="Eggs" value={me?.egg_count ?? 0} />
          </div>
          <p className="mt-2 text-center text-[11px] opacity-70">
            Tap Breakfast or Dinner to see the dates
          </p>
        </CardContent>
      </Card>

      {/* Big meal buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          size="xl"
          variant={todaysBreakfast ? "secondary" : "default"}
          className="h-32 flex-col gap-2"
          disabled={!!todaysBreakfast || createMeal.isPending}
          onClick={() => setPicker("breakfast")}
        >
          <Coffee className="h-9 w-9" />
          <span className="text-lg">උදේ කෑම</span>
          <span className="text-xs font-normal opacity-80">
            {todaysBreakfast ? "✓ Taken" : "Breakfast"}
          </span>
        </Button>
        <Button
          size="xl"
          variant={todaysDinner ? "secondary" : "accent"}
          className="h-32 flex-col gap-2"
          disabled={!!todaysDinner || createMeal.isPending}
          onClick={() => setPicker("dinner")}
        >
          <Moon className="h-9 w-9" />
          <span className="text-lg">රෑ කෑම</span>
          <span className="text-xs font-normal opacity-80">
            {todaysDinner ? "✓ Taken" : "Dinner"}
          </span>
        </Button>
      </div>

      {/* Today's summary */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="font-semibold">අද · Today</p>
          <TodayRow
            icon={<Coffee className="h-4 w-4" />}
            label="Breakfast"
            taken={!!todaysBreakfast}
          />
          <TodayRow icon={<Moon className="h-4 w-4" />} label="Dinner" taken={!!todaysDinner} />
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Egg className="h-4 w-4" /> Eggs
            </span>
            <span className="font-semibold">{todaysEggs}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="font-medium">අද එකතුව · Today&apos;s total</span>
            <span className="text-lg font-bold text-primary">{formatRs(todaysTotal)}</span>
          </div>
        </CardContent>
      </Card>

      <EggPicker
        open={picker !== null}
        onOpenChange={(open) => !open && setPicker(null)}
        mealLabel={picker === "breakfast" ? "උදේ කෑම · Breakfast" : "රෑ කෑම · Dinner"}
        onConfirm={handleConfirm}
        submitting={createMeal.isPending}
      />

      <MealDatesDialog
        mealType={datesFor}
        meals={datesList}
        onClose={() => setDatesFor(null)}
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const className = "rounded-xl bg-white/15 py-2";
  if (!onClick) {
    return (
      <div className={className}>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-[11px] opacity-90">{label}</p>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} transition-colors hover:bg-white/25 active:scale-[0.98]`}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] opacity-90">{label} ›</p>
    </button>
  );
}

function MealDatesDialog({
  mealType,
  meals,
  onClose,
}: {
  mealType: MealType | null;
  meals: MealRecord[];
  onClose: () => void;
}) {
  const label = mealType === "breakfast" ? "Breakfast · උදේ කෑම" : "Dinner · රෑ කෑම";
  return (
    <Dialog open={mealType !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {label} — {meals.length} {meals.length === 1 ? "day" : "days"}
          </DialogTitle>
        </DialogHeader>
        {meals.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No records yet.</p>
        ) : (
          <ul className="max-h-[55vh] space-y-1 overflow-y-auto">
            {meals.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl bg-secondary px-4 py-2.5 text-sm"
              >
                <span className="font-medium">
                  {format(new Date(`${m.meal_date}T00:00:00`), "EEE, dd MMM yyyy")}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {m.egg_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Egg className="h-3.5 w-3.5" />
                      {m.egg_count}
                    </span>
                  )}
                  <span className="font-semibold text-foreground">{formatRs(m.total_price)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TodayRow({
  icon,
  label,
  taken,
}: {
  icon: React.ReactNode;
  label: string;
  taken: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </span>
      <span
        className={`flex items-center gap-1 font-semibold ${
          taken ? "text-accent" : "text-muted-foreground"
        }`}
      >
        {taken ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        {taken ? "Taken" : "Not taken"}
      </span>
    </div>
  );
}
