"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSummaries, useMeals } from "@/lib/queries";
import { useCanViewReports } from "@/store/auth";
import { formatRs } from "@/lib/utils";
import { buildDetailedCsv, downloadCsv, openPrintableReport } from "@/lib/report-export";

export default function ReportsPage() {
  const canView = useCanViewReports();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: summaries, isLoading } = useSummaries(from || undefined, to || undefined);
  // Raw meals power the meal-by-meal detail in the CSV / PDF export.
  const { data: meals } = useMeals();

  if (!canView) {
    return <p className="py-12 text-center text-muted-foreground">Admins only.</p>;
  }

  const fileTag = `${from ? `-${from}` : ""}${to ? `-to-${to}` : ""}`;
  const downloadDisabled = !summaries?.length || !meals;

  const handleCsv = () => {
    if (!summaries || !meals) return;
    const csv = buildDetailedCsv(summaries, meals, from || undefined, to || undefined);
    downloadCsv(csv, `bathpatha-report${fileTag}.csv`);
  };

  const handlePdf = () => {
    if (!summaries || !meals) return;
    const ok = openPrintableReport(summaries, meals, from || undefined, to || undefined);
    if (!ok) toast.error("Please allow pop-ups to download the PDF report.");
  };

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
            <div className="min-w-0 space-y-1">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                max={to || undefined}
                className="w-full min-w-0 appearance-none"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="min-w-0 space-y-1">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                min={from || undefined}
                className="w-full min-w-0 appearance-none"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
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

      {/* Full report downloads — per-meal detail + per-person totals */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Download full report</p>
          <p className="text-xs text-muted-foreground">
            Every meal with names, dates and prices, plus the total owed per person
            {from || to ? " for the selected range" : ""}.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handlePdf} disabled={downloadDisabled}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" onClick={handleCsv} disabled={downloadDisabled}>
              <FileSpreadsheet className="h-4 w-4" /> CSV
            </Button>
          </div>
        </CardContent>
      </Card>
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
