"use client";

import { format, parseISO } from "date-fns";
import type { AggregateInsight, DayScore } from "@/lib/types";

interface RemarksPanelProps {
  today?: DayScore;
  weekly: AggregateInsight;
  monthly: AggregateInsight;
  recentScores: DayScore[];
}

export function RemarksPanel({
  today,
  weekly,
  monthly,
  recentScores,
}: RemarksPanelProps) {
  return (
    <div className="space-y-3 border-t border-blue-50 bg-slate-50/60 px-4 py-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
          Today&apos;s remark
        </p>
        <p className="mt-0.5 text-sm text-slate-700">
          {today?.remark ?? "Waiting for today’s check-ins…"}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <InsightCard insight={weekly} />
        <InsightCard insight={monthly} />
      </div>

      {recentScores.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
            Recent days
          </p>
          <ul className="space-y-1">
            {[...recentScores].reverse().slice(0, 4).map((s) => (
              <li
                key={s.date}
                className="flex items-start gap-2 text-xs text-slate-600"
              >
                <span className="w-14 shrink-0 font-medium text-blue-800">
                  {format(parseISO(s.date), "MMM d")}
                </span>
                <span className="min-w-0 flex-1">{s.remark}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: AggregateInsight }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
          {insight.label}
        </p>
        <p className="font-display text-lg font-bold text-blue-700">
          {insight.average}%
        </p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        {insight.insight}
      </p>
    </div>
  );
}
