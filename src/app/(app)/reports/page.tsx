"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSummaries } from "@/lib/queries";
import { useIsAdmin } from "@/store/auth";
import { formatRs } from "@/lib/utils";
import type { UserSummary } from "@/lib/types";

function exportCsv(summaries: UserSummary[], from: string, to: string) {
  const header = [
    "Name",
    "Breakfast",
    "Dinner",
    "Eggs",
    "Total Charged",
    "Total Settled",
    "Balance Owed",
  ];
  const rows = summaries.map((s) => [
    s.user.name,
    s.breakfast_count,
    s.dinner_count,
    s.egg_count,
    s.total_charged,
    s.total_settled,
    s.balance,
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bathpatha-report${from ? `-${from}` : ""}${to ? `-to-${to}` : ""}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const isAdmin = useIsAdmin();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: summaries, isLoading } = useSummaries(from || undefined, to || undefined);

  if (!isAdmin) {
    return <p className="py-12 text-center text-muted-foreground">Admins only.</p>;
  }

  const totals = (summaries ?? []).reduce(
    (acc, s) => ({
      breakfast: acc.breakfast + s.breakfast_count,
      dinner: acc.dinner + s.dinner_count,
      eggs: acc.eggs + s.egg_count,
      charged: acc.charged + s.total_charged,
      settled: acc.settled + s.total_settled,
      balance: acc.balance + s.balance,
    }),
    { breakfast: 0, dinner: 0, eggs: 0, charged: 0, settled: 0, balance: 0 },
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">වාර්තා · Reports</h1>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          {(from || to) && (
            <button
              className="text-xs text-muted-foreground underline"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Clear filter (show all-time)
            </button>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total owed (all)" value={formatRs(totals.balance)} highlight />
        <StatCard label="Total charged" value={formatRs(totals.charged)} />
        <StatCard label="Total settled" value={formatRs(totals.settled)} />
        <StatCard label="Meals" value={`${totals.breakfast + totals.dinner}`} />
        <StatCard label="Breakfasts" value={`${totals.breakfast}`} />
        <StatCard label="Dinners" value={`${totals.dinner}`} />
        <StatCard label="Eggs" value={`${totals.eggs}`} />
      </div>

      {/* Per-user table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading…</p>
          ) : (
            <div className="divide-y">
              {summaries?.map((s) => (
                <div key={s.user.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{s.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.breakfast_count} B · {s.dinner_count} D · {s.egg_count} eggs
                    </p>
                  </div>
                  <span className="font-bold">{formatRs(s.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => summaries && exportCsv(summaries, from, to)}
        disabled={!summaries?.length}
      >
        <Download className="h-4 w-4" /> Export CSV
      </Button>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "bg-primary text-primary-foreground" : undefined}>
      <CardContent className="p-4">
        <p className={`text-xs ${highlight ? "opacity-90" : "text-muted-foreground"}`}>{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
