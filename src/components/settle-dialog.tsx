"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettle, useSummaries } from "@/lib/queries";
import { formatRs, localDateString } from "@/lib/utils";

export function SettleDialog({
  open,
  onOpenChange,
  userId,
  userName,
  defaultAmount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  /** Whose balance is being settled — omitted/"your" when it's the current user. */
  userName?: string;
  /** Full current balance (used as the fallback suggestion for "today"). */
  defaultAmount: number;
}) {
  const today = localDateString();
  const settle = useSettle();
  const [settledOn, setSettledOn] = useState(today);
  const [amount, setAmount] = useState(String(defaultAmount));
  const [notes, setNotes] = useState("");
  const appliedDateRef = useRef<string | null>(null);

  // Balance accrued up to (and including) the chosen day — lets the user pay
  // off everything through a certain date, or any partial amount of it.
  const { data: sums } = useSummaries(undefined, settledOn);
  const owedUpTo = sums?.find((s) => s.user.id === userId)?.balance;

  // Reset when the dialog opens.
  useEffect(() => {
    if (open) {
      setSettledOn(today);
      setAmount(String(Math.max(defaultAmount, 0)));
      setNotes("");
      appliedDateRef.current = null;
    }
  }, [open, defaultAmount, today]);

  // When the date changes, suggest the amount owed up to that day (once per date).
  useEffect(() => {
    if (!open || owedUpTo === undefined) return;
    if (appliedDateRef.current !== settledOn) {
      setAmount(String(Math.max(owedUpTo, 0)));
      appliedDateRef.current = settledOn;
    }
  }, [open, owedUpTo, settledOn]);

  const isPartial = owedUpTo !== undefined && Number(amount) < owedUpTo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {userName ? `Settle ${userName}'s amount` : "Record a payment · ගෙවීමක් සටහන් කරන්න"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="settle-date">Paid up to date · දිනය</Label>
            <Input
              id="settle-date"
              type="date"
              max={today}
              value={settledOn}
              onChange={(e) => setSettledOn(e.target.value || today)}
            />
            <p className="text-xs text-muted-foreground">
              {owedUpTo === undefined
                ? "Calculating amount owed…"
                : `Owed up to this day: ${formatRs(owedUpTo)}`}
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="settle-amount">Amount paid (Rs.)</Label>
            <Input
              id="settle-amount"
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {isPartial ? "Partial payment — the rest stays owed." : "Pays the balance in full."}
              </p>
              {owedUpTo !== undefined && owedUpTo > 0 && (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary"
                  onClick={() => setAmount(String(owedUpTo))}
                >
                  Full ({formatRs(owedUpTo)})
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="settle-notes">Note (optional)</Label>
            <Input
              id="settle-notes"
              placeholder="e.g. paid aunty in cash"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={settle.isPending}
            onClick={() =>
              settle.mutate(
                {
                  user_id: userId,
                  amount: Number(amount),
                  notes: notes.trim() || undefined,
                  settled_on: settledOn,
                },
                {
                  onSuccess: () => {
                    toast.success("Payment recorded.");
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(e instanceof Error ? e.message : "Could not settle"),
                },
              )
            }
          >
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
