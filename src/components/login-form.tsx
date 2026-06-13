"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Delete, ShieldCheck } from "lucide-react";
import { apiListUsers, apiLogin } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";
import type { User } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [selected, setSelected] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["login-users"],
    queryFn: apiListUsers,
  });

  const submit = async (fullPin: string) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { user } = await apiLogin(selected.id, fullPin);
      setUser({ userId: user.id, name: user.name, role: user.role });
      toast.success(`ආයුබෝවන්, ${user.name}!`);
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
      setPin("");
      setSubmitting(false);
    }
  };

  const press = (digit: string) => {
    if (submitting) return;
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    if (next.length === 4) void submit(next);
  };

  // ---- user selection screen ----
  if (!selected) {
    return (
      <Card className="w-full">
        <CardContent className="p-5">
          <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
            ඔබ කවුද? · Who are you?
          </p>
          {isLoading && <p className="py-8 text-center text-muted-foreground">Loading…</p>}
          {error && (
            <p className="py-8 text-center text-sm text-destructive">
              Could not load users. Check your connection.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {users?.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setSelected(u);
                  setPin("");
                }}
                className="flex flex-col items-center gap-1 rounded-2xl border border-input bg-card p-5 text-center font-semibold transition-colors hover:border-primary hover:bg-secondary"
              >
                <Avatar name={u.name} className="h-12 w-12" textClassName="text-lg" />
                {u.name}
                {u.role === "admin" && (
                  <span className="flex items-center gap-1 text-[11px] font-normal text-accent">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- PIN entry screen ----
  return (
    <Card className="w-full">
      <CardContent className="p-5">
        <button
          onClick={() => {
            setSelected(null);
            setPin("");
          }}
          className="mb-2 flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <p className="text-center text-lg font-semibold">{selected.name}</p>
        <p className="mb-5 text-center text-sm text-muted-foreground">
          {selected.has_pin
            ? "PIN එක ඇතුළත් කරන්න · Enter your PIN"
            : "නව PIN එකක් සාදන්න · Create a 4-digit PIN"}
        </p>

        <div className="mb-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-4 w-4 rounded-full border-2 border-primary transition-colors",
                i < pin.length && "bg-primary",
              )}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              disabled={submitting}
              className="h-16 rounded-2xl bg-secondary text-2xl font-semibold transition-colors hover:bg-secondary/70 active:scale-95"
            >
              {d}
            </button>
          ))}
          <span />
          <button
            onClick={() => press("0")}
            disabled={submitting}
            className="h-16 rounded-2xl bg-secondary text-2xl font-semibold transition-colors hover:bg-secondary/70 active:scale-95"
          >
            0
          </button>
          <button
            onClick={() => setPin((p) => p.slice(0, -1))}
            disabled={submitting}
            className="flex h-16 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
