/**
 * Automated Remarks Engine
 * Context-aware daily + period feedback from completion %.
 */

function pickMissedPhrase(missed: string[]): string {
  if (missed.length === 0) return "";
  if (missed.length === 1) return `only missed '${missed[0]}'`;
  if (missed.length === 2)
    return `missed '${missed[0]}' and '${missed[1]}'`;
  return `missed ${missed.length} habits including '${missed[0]}'`;
}

export function generateDailyRemark(
  percentage: number,
  missed: string[]
): string {
  if (percentage === 0 && missed.length === 0) {
    return "No active habits today — add one to get started.";
  }

  const miss = pickMissedPhrase(missed);

  if (percentage === 100) {
    return "100% — Flawless day. Every habit locked in.";
  }
  if (percentage >= 90) {
    return `${formatPct(percentage)} — Strong discipline${miss ? `, ${miss}` : ""}.`;
  }
  if (percentage >= 75) {
    return `${formatPct(percentage)} — Solid effort${miss ? `; ${miss}` : ""}. Keep the momentum.`;
  }
  if (percentage >= 50) {
    return `${formatPct(percentage)} — Halfway there${miss ? `. Still open: ${miss.replace(/^missed /, "").replace(/^only /, "")}` : ""}.`;
  }
  if (percentage >= 25) {
    return `${formatPct(percentage)} — Rough patch${miss ? ` (${miss})` : ""}. One win at a time.`;
  }
  if (percentage > 0) {
    return `${formatPct(percentage)} — Tough day. Reset tomorrow; protect the streak.`;
  }
  return `0% — Blank slate. Start with one easy win.`;
}

export function generatePeriodInsight(
  period: "week" | "month",
  average: number,
  streak: number,
  daysTracked: number
): string {
  const unit = period === "week" ? "week" : "month";

  if (daysTracked === 0) {
    return `No tracked days this ${unit} yet.`;
  }

  if (average >= 90) {
    return `Exceptional ${unit}: ${formatPct(average)} average across ${daysTracked} days${
      streak >= 3 ? ` · ${streak}-day hot streak` : ""
    }.`;
  }
  if (average >= 75) {
    return `Consistent ${unit} at ${formatPct(average)} average. ${
      streak >= 2
        ? `${streak}-day streak of 80%+ days.`
        : "Push a few more days over 80%."
    }`;
  }
  if (average >= 50) {
    return `Mixed ${unit} (${formatPct(average)} avg). Focus on closing the gaps on missed habits.`;
  }
  return `This ${unit} needs attention — ${formatPct(average)} average. Pick 2–3 non-negotiables and protect them.`;
}

function formatPct(n: number): string {
  return Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;
}
