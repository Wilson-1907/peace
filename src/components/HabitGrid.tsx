"use client";

import { isFuture, isToday } from "date-fns";
import { Check } from "lucide-react";
import type { Completion, DayScore, Habit } from "@/lib/types";
import { toDateKey } from "@/lib/scoring";
import { formatExactDate } from "@/lib/year-calendar";
import clsx from "clsx";

interface HabitGridProps {
  habits: Habit[];
  completions: Completion[];
  userId: string;
  days: Date[];
  scores: DayScore[];
  readOnly: boolean;
  onToggle: (habitId: string, date: string) => void;
}

export function HabitGrid({
  habits,
  completions,
  userId,
  days,
  scores,
  readOnly,
  onToggle,
}: HabitGridProps) {
  const activeHabits = habits.filter((h) => h.is_active);

  const isChecked = (habitId: string, date: string) =>
    completions.some(
      (c) =>
        c.habit_id === habitId &&
        c.user_id === userId &&
        c.date === date &&
        c.completed
    );

  if (activeHabits.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-slate-500">
        No active habits yet. Open Manage habits to add some.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-blue-50">
            <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-blue-400">
              Habit
            </th>
            {days.map((day) => {
              const key = toDateKey(day);
              const score = scores.find((s) => s.date === key);
              const exact = formatExactDate(day);
              return (
                <th
                  key={key}
                  className={clsx(
                    "min-w-[4.5rem] px-1 py-2 text-center font-medium",
                    isToday(day) ? "bg-blue-50 text-blue-800" : "text-slate-500"
                  )}
                  title={
                    score
                      ? `${exact.weekday} ${exact.dayMonth} ${exact.year}: ${score.percentage}%`
                      : `${exact.weekday} ${exact.dayMonth} ${exact.year}`
                  }
                >
                  <div className="text-[10px] uppercase tracking-wide">
                    {exact.weekday}
                  </div>
                  <div className="text-xs font-semibold tabular-nums text-blue-950">
                    {exact.dayMonth}
                  </div>
                  <div className="text-[9px] font-medium text-blue-400">
                    {exact.year}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {activeHabits.map((habit) => (
            <tr key={habit.id} className="border-b border-blue-50/80">
              <td className="sticky left-0 z-10 max-w-[9rem] truncate bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700">
                {habit.name}
              </td>
              {days.map((day) => {
                const key = toDateKey(day);
                const checked = isChecked(habit.id, key);
                const canMark = isToday(day);
                const disabled = readOnly || !canMark;
                const exact = formatExactDate(day);

                return (
                  <td
                    key={key}
                    className={clsx(
                      "px-1 py-1 text-center",
                      isToday(day) && "bg-blue-50/60"
                    )}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`${habit.name} on ${exact.weekday} ${exact.dayMonth} ${exact.year}`}
                      title={
                        canMark
                          ? `Track for ${exact.dayMonth} ${exact.year}`
                          : isFuture(day)
                            ? `Locked until ${exact.dayMonth} ${exact.year}`
                            : `Saved · ${exact.dayMonth} ${exact.year}`
                      }
                      onClick={() => {
                        if (!disabled) onToggle(habit.id, key);
                      }}
                      className={clsx(
                        "mx-auto flex h-7 w-7 items-center justify-center rounded-md border transition",
                        checked
                          ? "check-pop border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-transparent",
                        disabled
                          ? "cursor-not-allowed opacity-45"
                          : "hover:border-blue-400 hover:bg-blue-50",
                        canMark && !checked && "border-blue-300 ring-1 ring-blue-200"
                      )}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-blue-50/40">
            <td className="sticky left-0 z-10 bg-blue-50/90 px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-blue-500">
              Daily %
            </td>
            {days.map((day) => {
              const key = toDateKey(day);
              const score = scores.find((s) => s.date === key);
              const pct = score && score.active > 0 ? score.percentage : null;
              return (
                <td
                  key={key}
                  className={clsx(
                    "px-1 py-1 text-center text-[10px] font-semibold tabular-nums",
                    pct === null
                      ? "text-slate-300"
                      : pct >= 80
                        ? "text-blue-700"
                        : pct >= 50
                          ? "text-amber-600"
                          : "text-rose-500"
                  )}
                  title={score?.remark}
                >
                  {pct === null ? "·" : Math.round(pct)}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
