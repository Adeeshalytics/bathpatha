"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Coffee, Moon, Egg, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EggPicker } from "@/components/egg-picker";
import { LogoutButton } from "@/components/logout-button";
import { useAuth } from "@/store/auth";
import { useCreateMeal, useMeals, useSummaries } from "@/lib/queries";
import { formatRs, localDateString } from "@/lib/utils";
import type { MealType } from "@/lib/types";

export default function DashboardPage() {
  const userId = useAuth((s) => s.userId);
  const name = useAuth((s) => s.name);
  const today = localDateString();

  const { data: summaries } = useSummaries();
  const { data: meals } = useMeals(userId ?? undefined);
  const createMeal = useCreateMeal();

  const [picker, setPicker] = useState<MealType | null>(null);

  const me = useMemo(
    () => summaries?.find((s) => s.user.id === userId),
    [summaries, userId],
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">ආයුබෝවන් · Hello</p>
          <h1 className="text-2xl font-bold">{name ?? "…"}</h1>
        </div>
        <LogoutButton />
      </div>

      {/* Current user card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-5">
          <p className="text-sm opacity-90">ගෙවිය යුතු මුළු මුදල · Total owed</p>
          <p className="text-4xl font-bold tracking-tight">
            {me ? formatRs(me.balance) : "Rs. 0"}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Breakfast" value={me?.breakfast_count ?? 0} />
            <MiniStat label="Dinner" value={me?.dinner_count ?? 0} />
            <MiniStat label="Eggs" value={me?.egg_count ?? 0} />
          </div>
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
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/15 py-2">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] opacity-90">{label}</p>
    </div>
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
