// =====================================================================
//  Meal report export — detailed CSV + printable (Save-as-PDF) report.
//  Covers every meal with person, date, meal, eggs and price, plus a
//  per-person totals summary. Respects the Reports screen's date filter.
// =====================================================================
import { format, parseISO } from "date-fns";
import { formatRs } from "./utils";
import type { MealRecord, Settlement, UserSummary } from "./types";

export interface DetailRow {
  userId: string;
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
      userId: m.user_id,
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

/**
 * Keep only settlements whose payment date falls inside the report window —
 * mirroring the summaries endpoint so the per-person "Owed" reconciles exactly.
 */
export function settlementsInRange(
  settlements: Settlement[],
  from?: string,
  to?: string,
): Settlement[] {
  return settlements.filter(
    (s) =>
      (!from || s.settled_at >= from) &&
      (!to || s.settled_at <= `${to}T23:59:59.999Z`),
  );
}

// ---------------------------------------------------------------------
//  CSV
// ---------------------------------------------------------------------
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const csvRow = (cells: (string | number)[]) => cells.map(csvCell).join(",");

export function buildDetailedCsv(
  summaries: UserSummary[],
  meals: MealRecord[],
  settlements: Settlement[],
  from?: string,
  to?: string,
): string {
  const names = nameMap(summaries);
  const details = buildDetailRows(meals, names, from, to);
  const payments = settlementsInRange(settlements, from, to).sort(
    (a, b) =>
      (names.get(a.user_id) ?? "").localeCompare(names.get(b.user_id) ?? "") ||
      a.settled_at.localeCompare(b.settled_at),
  );

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
  lines.push("");

  // Payments (settlements) recorded in the window
  lines.push(csvRow(["Payments"]));
  lines.push(csvRow(["Date", "Name", "Amount Paid (Rs)", "Notes"]));
  if (payments.length === 0) {
    lines.push(csvRow(["(none)", "", "", ""]));
  } else {
    for (const p of payments) {
      lines.push(
        csvRow([
          format(parseISO(p.settled_at), "yyyy-MM-dd"),
          names.get(p.user_id) ?? "Unknown",
          p.amount,
          p.notes ?? "",
        ]),
      );
    }
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
  settlements: Settlement[],
  from?: string,
  to?: string,
): string {
  const details = buildDetailRows(meals, nameMap(summaries), from, to);
  const rangeSettlements = settlementsInRange(settlements, from, to);

  // The report opens as an about:blank window (opaque origin), so bake the
  // app's real origin in now for the "Back to app" navigation fallback.
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";

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

  // Per-person breakdown: meals + payments in date order, closing on the
  // amount still owed (charged − paid) taken straight from the summary so it
  // reconciles exactly with the table above.
  const mealsByUser = new Map<string, DetailRow[]>();
  for (const r of details) {
    const list = mealsByUser.get(r.userId) ?? [];
    list.push(r);
    mealsByUser.set(r.userId, list);
  }
  const paysByUser = new Map<string, Settlement[]>();
  for (const p of rangeSettlements) {
    const list = paysByUser.get(p.user_id) ?? [];
    list.push(p);
    paysByUser.set(p.user_id, list);
  }

  const detailSections = summaries
    .filter(
      (s) =>
        (mealsByUser.get(s.user.id)?.length ?? 0) > 0 ||
        (paysByUser.get(s.user.id)?.length ?? 0) > 0,
    )
    .map((s) => {
      const mealRows = mealsByUser.get(s.user.id) ?? [];
      const payRows = paysByUser.get(s.user.id) ?? [];

      // Interleave meals and payments chronologically (payments after meals on
      // the same day).
      const rows: { sort: string; html: string }[] = [];
      for (const r of mealRows) {
        rows.push({
          sort: `${r.date}0`,
          html: `<tr>
            <td>${esc(fmtDate(r.date))}</td>
            <td>${esc(mealLabel(r.meal))}</td>
            <td class="num">${r.eggs}</td>
            <td class="num">${esc(formatRs(r.mealPrice))}</td>
            <td class="num">${esc(formatRs(r.eggTotal))}</td>
            <td class="num">${esc(formatRs(r.total))}</td>
          </tr>`,
        });
      }
      for (const p of payRows) {
        const d = p.settled_at.slice(0, 10);
        rows.push({
          sort: `${d}1`,
          html: `<tr class="pay">
            <td>${esc(fmtDate(d))}</td>
            <td colspan="4">Payment${p.notes ? ` · ${esc(p.notes)}` : ""}</td>
            <td class="num">− ${esc(formatRs(p.amount))}</td>
          </tr>`,
        });
      }
      rows.sort((a, b) => a.sort.localeCompare(b.sort));
      const body = rows.map((r) => r.html).join("");

      const pill =
        `<span class="pill">${mealRows.length} meal${mealRows.length === 1 ? "" : "s"}</span>` +
        (payRows.length
          ? ` <span class="pill pay-pill">${payRows.length} payment${payRows.length === 1 ? "" : "s"}</span>`
          : "");

      const paidRow = s.total_settled
        ? `<tr class="pay"><td colspan="5">Paid</td><td class="num">− ${esc(formatRs(s.total_settled))}</td></tr>`
        : "";

      return `<section class="person">
        <h3>${esc(s.user.name)} ${pill}</h3>
        <table class="detail">
          <thead><tr><th>Date</th><th>Meal</th><th class="num">Eggs</th><th class="num">Meal</th><th class="num">Eggs Rs</th><th class="num">Total</th></tr></thead>
          <tbody>${body}</tbody>
          <tfoot>
            <tr><td colspan="5">Charged</td><td class="num">${esc(formatRs(s.total_charged))}</td></tr>
            ${paidRow}
            <tr class="owed-row"><td colspan="5">Owed</td><td class="num owed">${esc(formatRs(s.balance))}</td></tr>
          </tfoot>
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
  .pay-pill { color:#157f43; background:#e6f5ec; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { text-align:left; padding:7px 10px; border-bottom:1px solid var(--line); }
  th { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); }
  .num { text-align:right; font-variant-numeric:tabular-nums; }
  .owed { font-weight:700; color:var(--brand); }
  tr.pay td { color:#157f43; }
  tfoot td { font-weight:700; border-bottom:none; }
  tfoot tr:first-child td { border-top:2px solid var(--brand); }
  tr.owed-row td { font-size:14px; }
  section.person { break-inside:avoid; }
  .empty { color:var(--muted); font-style:italic; padding:16px 0; }
  .print-bar { position:sticky; top:0; z-index:5; display:flex; flex-wrap:wrap; align-items:center; gap:10px; background:#fff; padding:10px 0 16px; margin-bottom:8px; border-bottom:1px solid var(--line); }
  .print-bar button { font:inherit; font-weight:700; border:none; border-radius:10px; padding:10px 18px; cursor:pointer; }
  .print-bar .btn-print { background:var(--brand); color:#fff; }
  .print-bar .btn-close { background:#f3efe9; color:var(--ink); border:1px solid var(--line); }
  .print-bar span { color:var(--muted); font-size:12px; }
  @media print { .print-bar { display:none; } body { padding:0; } }
</style></head>
<body>
  <div class="print-bar">
    <button class="btn-close" onclick="closeReport()">← Back to app</button>
    <button class="btn-print" onclick="window.print()">Save as PDF / Print</button>
    <span>Choose “Save as PDF” as the destination.</span>
  </div>
  <script>
    function closeReport() {
      // Bring the app window back to the front if we still have a handle to it,
      // then close this report window (allowed because it was script-opened).
      try { if (window.opener && !window.opener.closed) window.opener.focus(); } catch (e) {}
      window.close();
      // Fallback for contexts (some installed PWAs) where close() is a no-op:
      // navigate this same window back to the app's Reports screen.
      setTimeout(function () {
        var app = ${JSON.stringify(appOrigin)};
        if (app) window.location.replace(app + '/reports');
      }, 200);
    }
  </script>
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
  settlements: Settlement[],
  from?: string,
  to?: string,
): boolean {
  const html = buildReportHtml(summaries, meals, settlements, from, to);
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
