// =====================================================================
//  Meal report export — detailed CSV + printable (Save-as-PDF) report.
//  Covers every meal with person, date, meal, eggs and price, plus a
//  per-person totals summary. Respects the Reports screen's date filter.
// =====================================================================
import { format, parseISO } from "date-fns";
import { formatRs } from "./utils";
import type { MealRecord, UserSummary } from "./types";

export interface DetailRow {
  date: string; // YYYY-MM-DD
  name: string;
  meal: "breakfast" | "dinner";
  eggs: number;
  mealPrice: number;
  eggTotal: number;
  total: number;
}

const mealLabel = (m: "breakfast" | "dinner") => (m === "breakfast" ? "Breakfast" : "Dinner");
const fmtDate = (d: string) => {
  try {
    return format(parseISO(d), "dd MMM yyyy");
  } catch {
    return d;
  }
};

function rangeLabel(from?: string, to?: string): string {
  if (from && to) return `${fmtDate(from)} – ${fmtDate(to)}`;
  if (from) return `From ${fmtDate(from)}`;
  if (to) return `Up to ${fmtDate(to)}`;
  return "All time";
}

/**
 * Build the ordered detail rows (by person, then date) from the raw meal
 * records, filtered to the given date range and joined with user names.
 */
export function buildDetailRows(
  meals: MealRecord[],
  nameById: Map<string, string>,
  from?: string,
  to?: string,
): DetailRow[] {
  return meals
    .filter((m) => (!from || m.meal_date >= from) && (!to || m.meal_date <= to))
    .map((m) => ({
      date: m.meal_date,
      name: nameById.get(m.user_id) ?? "Unknown",
      meal: m.meal_type,
      eggs: m.egg_count,
      mealPrice: m.meal_price,
      eggTotal: m.egg_count * m.egg_price,
      total: m.total_price,
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.date.localeCompare(b.date));
}

function nameMap(summaries: UserSummary[]): Map<string, string> {
  return new Map(summaries.map((s) => [s.user.id, s.user.name]));
}

// ---------------------------------------------------------------------
//  CSV
// ---------------------------------------------------------------------
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const csvRow = (cells: (string | number)[]) => cells.map(csvCell).join(",");

export function buildDetailedCsv(
  summaries: UserSummary[],
  meals: MealRecord[],
  from?: string,
  to?: string,
): string {
  const details = buildDetailRows(meals, nameMap(summaries), from, to);

  const lines: string[] = [];
  lines.push(csvRow(["Bathpatha — Meal Report"]));
  lines.push(csvRow(["Range", rangeLabel(from, to)]));
  lines.push(csvRow(["Generated", format(new Date(), "dd MMM yyyy HH:mm")]));
  lines.push("");

  // Per-person summary
  lines.push(csvRow(["Per person"]));
  lines.push(
    csvRow([
      "Name",
      "Breakfasts",
      "Dinners",
      "Eggs",
      "Total Charged (Rs)",
      "Total Settled (Rs)",
      "Balance Owed (Rs)",
    ]),
  );
  const totals = { b: 0, d: 0, eggs: 0, charged: 0, settled: 0, balance: 0 };
  for (const s of summaries) {
    lines.push(
      csvRow([
        s.user.name,
        s.breakfast_count,
        s.dinner_count,
        s.egg_count,
        s.total_charged,
        s.total_settled,
        s.balance,
      ]),
    );
    totals.b += s.breakfast_count;
    totals.d += s.dinner_count;
    totals.eggs += s.egg_count;
    totals.charged += s.total_charged;
    totals.settled += s.total_settled;
    totals.balance += s.balance;
  }
  lines.push(
    csvRow(["TOTAL", totals.b, totals.d, totals.eggs, totals.charged, totals.settled, totals.balance]),
  );
  lines.push("");

  // Meal-by-meal detail
  lines.push(csvRow(["Meal details"]));
  lines.push(
    csvRow(["Date", "Name", "Meal", "Eggs", "Meal Price (Rs)", "Egg Total (Rs)", "Line Total (Rs)"]),
  );
  for (const r of details) {
    lines.push(csvRow([r.date, r.name, mealLabel(r.meal), r.eggs, r.mealPrice, r.eggTotal, r.total]));
  }

  return lines.join("\n");
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------
//  Printable report (browser "Save as PDF")
// ---------------------------------------------------------------------
const esc = (v: string | number) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function buildReportHtml(
  summaries: UserSummary[],
  meals: MealRecord[],
  from?: string,
  to?: string,
): string {
  const details = buildDetailRows(meals, nameMap(summaries), from, to);

  const totals = summaries.reduce(
    (a, s) => ({
      b: a.b + s.breakfast_count,
      d: a.d + s.dinner_count,
      eggs: a.eggs + s.egg_count,
      charged: a.charged + s.total_charged,
      settled: a.settled + s.total_settled,
      balance: a.balance + s.balance,
    }),
    { b: 0, d: 0, eggs: 0, charged: 0, settled: 0, balance: 0 },
  );

  const summaryRows = summaries
    .map(
      (s) => `<tr>
        <td>${esc(s.user.name)}</td>
        <td class="num">${s.breakfast_count}</td>
        <td class="num">${s.dinner_count}</td>
        <td class="num">${s.egg_count}</td>
        <td class="num">${esc(formatRs(s.total_charged))}</td>
        <td class="num">${esc(formatRs(s.total_settled))}</td>
        <td class="num owed">${esc(formatRs(s.balance))}</td>
      </tr>`,
    )
    .join("");

  // Group the detail rows by person for a readable per-person breakdown.
  const byPerson = new Map<string, DetailRow[]>();
  for (const r of details) {
    if (!byPerson.has(r.name)) byPerson.set(r.name, []);
    byPerson.get(r.name)!.push(r);
  }

  const detailSections = [...byPerson.entries()]
    .map(([name, rows]) => {
      const sub = rows.reduce((a, r) => a + r.total, 0);
      const body = rows
        .map(
          (r) => `<tr>
            <td>${esc(fmtDate(r.date))}</td>
            <td>${esc(mealLabel(r.meal))}</td>
            <td class="num">${r.eggs}</td>
            <td class="num">${esc(formatRs(r.mealPrice))}</td>
            <td class="num">${esc(formatRs(r.eggTotal))}</td>
            <td class="num">${esc(formatRs(r.total))}</td>
          </tr>`,
        )
        .join("");
      return `<section class="person">
        <h3>${esc(name)} <span class="pill">${rows.length} meal${rows.length === 1 ? "" : "s"}</span></h3>
        <table class="detail">
          <thead><tr><th>Date</th><th>Meal</th><th class="num">Eggs</th><th class="num">Meal</th><th class="num">Eggs Rs</th><th class="num">Total</th></tr></thead>
          <tbody>${body}</tbody>
          <tfoot><tr><td colspan="5">Subtotal</td><td class="num">${esc(formatRs(sub))}</td></tr></tfoot>
        </table>
      </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bathpatha — Meal Report</title>
<style>
  :root { --brand:#E8730F; --ink:#1c1917; --muted:#78716c; --line:#e7e0d8; }
  * { box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; color:var(--ink); margin:0; padding:28px; }
  header { display:flex; justify-content:space-between; align-items:flex-end; border-bottom:3px solid var(--brand); padding-bottom:12px; margin-bottom:20px; }
  .brand { font-size:30px; font-weight:800; color:var(--brand); letter-spacing:.5px; }
  .brand small { display:block; font-size:12px; font-weight:600; color:var(--muted); letter-spacing:1px; }
  .meta { text-align:right; font-size:12px; color:var(--muted); line-height:1.5; }
  h2 { font-size:15px; text-transform:uppercase; letter-spacing:1px; color:var(--muted); margin:26px 0 8px; }
  h3 { font-size:15px; margin:18px 0 6px; }
  .pill { font-size:11px; font-weight:600; color:var(--brand); background:#fbead9; border-radius:999px; padding:2px 8px; margin-left:6px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { text-align:left; padding:7px 10px; border-bottom:1px solid var(--line); }
  th { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); }
  .num { text-align:right; font-variant-numeric:tabular-nums; }
  .owed { font-weight:700; color:var(--brand); }
  table.summary tfoot td, table.detail tfoot td { font-weight:700; border-top:2px solid var(--brand); border-bottom:none; }
  section.person { break-inside:avoid; }
  .empty { color:var(--muted); font-style:italic; padding:16px 0; }
  .print-bar { position:sticky; top:0; background:#fff; padding:10px 0 16px; margin-bottom:8px; }
  .print-bar button { font:inherit; font-weight:700; background:var(--brand); color:#fff; border:none; border-radius:10px; padding:10px 18px; cursor:pointer; }
  .print-bar span { color:var(--muted); font-size:12px; margin-left:10px; }
  @media print { .print-bar { display:none; } body { padding:0; } }
</style></head>
<body>
  <div class="print-bar">
    <button onclick="window.print()">Save as PDF / Print</button>
    <span>Choose “Save as PDF” as the destination.</span>
  </div>
  <header>
    <div class="brand">බත්පත<small>BATHPATHA · MEAL REPORT</small></div>
    <div class="meta">Range: ${esc(rangeLabel(from, to))}<br>Generated: ${esc(format(new Date(), "dd MMM yyyy HH:mm"))}</div>
  </header>

  <h2>Per person — amount owed</h2>
  <table class="summary">
    <thead><tr><th>Name</th><th class="num">B</th><th class="num">D</th><th class="num">Eggs</th><th class="num">Charged</th><th class="num">Settled</th><th class="num">Owed</th></tr></thead>
    <tbody>${summaryRows || `<tr><td colspan="7" class="empty">No records.</td></tr>`}</tbody>
    <tfoot><tr><td>Total</td><td class="num">${totals.b}</td><td class="num">${totals.d}</td><td class="num">${totals.eggs}</td><td class="num">${esc(formatRs(totals.charged))}</td><td class="num">${esc(formatRs(totals.settled))}</td><td class="num owed">${esc(formatRs(totals.balance))}</td></tr></tfoot>
  </table>

  <h2>Meal details</h2>
  ${detailSections || `<p class="empty">No meals in this range.</p>`}
</body></html>`;
}

/**
 * Open the printable report in a new window and trigger the print dialog, from
 * which the user picks "Save as PDF". Returns false if a popup blocker stopped it.
 */
export function openPrintableReport(
  summaries: UserSummary[],
  meals: MealRecord[],
  from?: string,
  to?: string,
): boolean {
  const html = buildReportHtml(summaries, meals, from, to);
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
