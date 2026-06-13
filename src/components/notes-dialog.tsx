"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const storageKey = (userId: string) => `bathpatha:notes:${userId}`;

/**
 * A plain notepad — a single auto-saving textarea, no tabs or buttons.
 * Notes are kept in localStorage, scoped per user on this device.
 */
export function NotesDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);

  // Load the saved note whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setText(localStorage.getItem(storageKey(userId)) ?? "");
      setSaved(true);
    }
  }, [open, userId]);

  // Debounced auto-save while typing.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onChange = (value: string) => {
    setText(value);
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      localStorage.setItem(storageKey(userId), value);
      setSaved(true);
    }, 400);
  };

  // Make sure the latest text is persisted when the dialog closes.
  useEffect(() => {
    if (!open) clearTimeout(timer.current);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      clearTimeout(timer.current);
      localStorage.setItem(storageKey(userId), text);
      setSaved(true);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>සටහන් · Notes</span>
            <span className="text-xs font-normal text-muted-foreground">
              {saved ? "Saved" : "Saving…"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="මතක තබා ගත යුතු දේ මෙහි ලියන්න… · Jot down anything to remember…"
          className="h-64 w-full resize-none rounded-2xl border border-input bg-card p-4 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
        />
      </DialogContent>
    </Dialog>
  );
}
