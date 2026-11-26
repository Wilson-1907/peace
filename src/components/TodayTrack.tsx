"use client";

import { format } from "date-fns";
import { Check } from "lucide-react";
import type { Completion, Habit } from "@/lib/types";
import { isHabitActiveOnDay, toDateKey } from "@/lib/scoring";
import clsx from "clsx";

interface TodayTrackProps {
  habits: Habit[];
  completions: Completion[];
  userId: string;
  readOnly: boolean;
  onToggle: (habitId: string, date: string) => void;
}

/**
 * Core of the tracking system: mark today's habits, one day at a time.
 */
export function TodayTrack({
  habits,
  completions,
  userId,
  readOnly,
  onToggle,
}: TodayTrackProps) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const activeToday = habits
    .filter((h) => h.is_active && isHabitActiveOnDay(h, today))
    .sort((a, b) => a.sort_order - b.sort_order);

  const doneCount = activeToday.filter((h) =>
    completions.some(
      (c) =>
        c.habit_id === h.id &&
        c.user_id === userId &&
        c.date === todayKey &&
        c.completed
    )
  ).length;

  const total = activeToday.length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <div className="border-b border-blue-50 bg-gradient-to-b from-blue-50/80 to-white px-4 py-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
            Today&apos;s tracking
          </p>
          <p className="font-display text-lg font-semibold text-blue-950">
            {format(today, "EEEE, MMM d")}
          </p>
          <p className="text-xs text-slate-500">
            Mark only today — tomorrow unlocks tomorrow.
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold tabular-nums text-blue-700">
            {pct}%
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-blue-400">
            {doneCount}/{total} done
          </p>
        </div>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-blue-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-blue-200 bg-white px-3 py-4 text-center text-sm text-slate-500">
          No habits to track yet. Open Manage habits to add some.
        </p>
      ) : (
        <ul className="space-y-2">
          {activeToday.map((habit) => {
            const checked = completions.some(
              (c) =>
                c.habit_id === habit.id &&
                c.user_id === userId &&
                c.date === todayKey &&
                c.completed
            );
            return (
              <li key={habit.id}>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    if (!readOnly) onToggle(habit.id, todayKey);
                  }}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
                    checked
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                      : "border-blue-100 bg-white text-slate-800 hover:border-blue-300",
                    readOnly && "cursor-not-allowed opacity-60"
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2",
                      checked
                        ? "check-pop border-white/40 bg-white/20 text-white"
                        : "border-blue-200 text-transparent"
                    )}
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {habit.name}
                    </span>
                    <span
                      className={clsx(
                        "text-[10px] uppercase tracking-wide",
                        checked ? "text-blue-100" : "text-blue-400"
                      )}
                    >
                      {checked ? "Tracked" : readOnly ? "Waiting" : "Tap to track"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
