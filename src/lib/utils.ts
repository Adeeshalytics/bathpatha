import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer rupee amount as "Rs. 1,850". */
export function formatRs(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString("en-LK")}`;
}

/** Local YYYY-MM-DD for a given date (defaults to now), in the user's timezone. */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whether a record created at `createdAt` is still editable by its owner (< 48h). */
export function isWithinEditWindow(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs < 48 * 60 * 60 * 1000;
}
