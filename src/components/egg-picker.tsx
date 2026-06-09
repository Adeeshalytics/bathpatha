"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EGG_OPTIONS = [0, 1, 2, 3, 4];

export function EggPicker({
  open,
  onOpenChange,
  mealLabel,
  onConfirm,
  submitting,
  initial = 0,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealLabel: string;
  onConfirm: (eggCount: number) => void;
  submitting?: boolean;
  initial?: number;
  confirmLabel?: string;
}) {
  const [eggs, setEggs] = useState(initial);

  // reset to the starting value each time it opens
  const handleOpenChange = (next: boolean) => {
    if (next) setEggs(initial);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mealLabel}</DialogTitle>
          <DialogDescription>බිත්තර කීයක්ද? · How many eggs?</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-2">
          {EGG_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setEggs(n)}
              className={cn(
                "flex h-16 items-center justify-center rounded-2xl border text-2xl font-bold transition-colors",
                eggs === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card text-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <Button
          size="lg"
          className="mt-2 w-full"
          disabled={submitting}
          onClick={() => onConfirm(eggs)}
        >
          {submitting ? "Saving…" : (confirmLabel ?? "තහවුරු කරන්න · Confirm")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
