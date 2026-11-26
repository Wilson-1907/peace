import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { AggregateInsight, Completion, DayScore, Habit } from "./types";
import { generateDailyRemark, generatePeriodInsight } from "./remarks";

/** YYYY-MM-DD helpers */
export function toDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function daysInMonth(year: number, monthIndex: number): Date[] {
  const start = startOfMonth(new Date(year, monthIndex, 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end });
}

/**
 * A habit counts as "active on day D" iff:
 *   created_at <= end of D
 *   AND (still active OR archived_at > start of D)
 *
 * This prevents mid-month adds from rewriting past scores,
 * and preserves archived habits in historical denominators.
 */
export function isHabitActiveOnDay(habit: Habit, day: Date): boolean {
  const dayStart = startOfDay(day);
  const created = parseISO(habit.created_at);

  if (isAfter(created, endOfDaySafe(day))) return false;

  if (habit.is_active) return true;

  if (habit.archived_at) {
    const archived = parseISO(habit.archived_at);
    // Count on days before the archive moment
    return isAfter(archived, dayStart);
  }

  return false;
}

function endOfDaySafe(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function habitsVisibleForUser(
  habits: Habit[],
  ownerId: string,
  _viewerIsOwner: boolean,
  partnerId: string | null
): Habit[] {
  return habits
    .filter((h) => {
      // Habits created by this user assigned to me/both
      if (h.user_id === ownerId) {
        if (h.assigned_to === "partner") return false;
        return true;
      }
      // Habits created by partner assigned to partner/both → show on this grid
      if (partnerId && h.user_id === partnerId) {
        if (h.assigned_to === "me") return false;
        if (h.assigned_to === "partner" || h.assigned_to === "both") return true;
      }
      return false;
    })
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export function computeDayScore(
  habits: Habit[],
  completions: Completion[],
  userId: string,
  day: Date
): DayScore {
  const dateKey = toDateKey(day);
  const activeHabits = habits.filter((h) => isHabitActiveOnDay(h, day));

  let completed = 0;
  const missed: string[] = [];

  for (const habit of activeHabits) {
    const row = completions.find(
      (c) =>
        c.habit_id === habit.id &&
        c.user_id === userId &&
        c.date === dateKey &&
        c.completed
    );
    if (row) {
      completed += 1;
    } else {
      missed.push(habit.name);
    }
  }

  const active = activeHabits.length;
  const percentage =
    active === 0 ? 0 : Math.round((completed / active) * 1000) / 10;

  return {
    date: dateKey,
    completed,
    active,
    percentage,
    missed,
    remark: generateDailyRemark(percentage, missed),
  };
}

export function computeMonthScores(
  habits: Habit[],
  completions: Completion[],
  userId: string,
  year: number,
  monthIndex: number
): DayScore[] {
  return daysInMonth(year, monthIndex).map((day) =>
    computeDayScore(habits, completions, userId, day)
  );
}

export function computeWeeklyInsight(
  scores: DayScore[],
  reference: Date = new Date()
): AggregateInsight {
  const start = startOfWeek(reference, { weekStartsOn: 1 });
  const end = endOfWeek(reference, { weekStartsOn: 1 });
  const weekScores = scores.filter((s) => {
    const d = parseISO(s.date);
    return !isBefore(d, start) && !isAfter(d, end);
  });
  return buildAggregate("week", "This week", weekScores);
}

export function computeMonthlyInsight(
  scores: DayScore[],
  year: number,
  monthIndex: number
): AggregateInsight {
  const label = format(new Date(year, monthIndex, 1), "MMMM yyyy");
  return buildAggregate("month", label, scores);
}

function buildAggregate(
  period: "week" | "month",
  label: string,
  scores: DayScore[]
): AggregateInsight {
  const withActivity = scores.filter((s) => s.active > 0);
  if (withActivity.length === 0) {
    return {
      period,
      label,
      average: 0,
      bestDay: null,
      worstDay: null,
      streak: 0,
      insight: generatePeriodInsight(period, 0, 0, 0),
    };
  }

  const average =
    Math.round(
      (withActivity.reduce((sum, s) => sum + s.percentage, 0) /
        withActivity.length) *
        10
    ) / 10;

  const best = [...withActivity].sort((a, b) => b.percentage - a.percentage)[0];
  const worst = [...withActivity].sort((a, b) => a.percentage - b.percentage)[0];

  let streak = 0;
  for (let i = withActivity.length - 1; i >= 0; i--) {
    if (withActivity[i].percentage >= 80) streak += 1;
    else break;
  }

  return {
    period,
    label,
    average,
    bestDay: best?.date ?? null,
    worstDay: worst?.date ?? null,
    streak,
    insight: generatePeriodInsight(period, average, streak, withActivity.length),
  };
}
