"use client";

import { useEffect, useState } from "react";
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
import { useSettle } from "@/lib/queries";
import { formatRs } from "@/lib/utils";

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
  defaultAmount: number;
}) {
  const settle = useSettle();
  const [amount, setAmount] = useState(String(defaultAmount));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(String(Math.max(defaultAmount, 0)));
      setNotes("");
    }
  }, [open, defaultAmount]);

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
            <Label htmlFor="settle-amount">Amount paid (Rs.)</Label>
            <Input
              id="settle-amount"
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Current balance: {formatRs(defaultAmount)}. Recording a payment reduces the balance;
              new meals keep accumulating afterward.
            </p>
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
                { user_id: userId, amount: Number(amount), notes: notes.trim() || undefined },
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
