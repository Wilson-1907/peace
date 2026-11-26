/**
 * Week-by-week calendar from TODAY through the end of the year.
 * Example: if today is 26 Nov 2026 → first week starts on the 26th.
 */
import {
  addDays,
  eachDayOfInterval,
  format,
  isBefore,
  isSameDay,
  startOfDay,
} from "date-fns";

export interface TrackWeek {
  id: string; // start date key
  index: number; // 1-based week number in the plan
  start: Date;
  end: Date;
  days: Date[];
  label: string; // e.g. "26 Nov – 2 Dec 2026"
  shortLabel: string; // e.g. "Week 1 · 26 Nov"
}

/** Anchor: local today at midnight */
export function trackingStart(now: Date = new Date()): Date {
  return startOfDay(now);
}

/** End of the current calendar year */
export function trackingEnd(now: Date = new Date()): Date {
  return startOfDay(new Date(now.getFullYear(), 11, 31));
}

/**
 * Build consecutive 7-day weeks starting from `from` (today),
 * clipped to year end. Saved marks stay on their exact dates;
 * when a week ends, the next week becomes the active window.
 */
export function buildYearWeeks(now: Date = new Date()): TrackWeek[] {
  const from = trackingStart(now);
  const until = trackingEnd(now);
  if (isBefore(until, from)) return [];

  const weeks: TrackWeek[] = [];
  let cursor = from;
  let index = 1;

  while (!isBefore(until, cursor)) {
    const remaining =
      Math.floor(
        (until.getTime() - cursor.getTime()) / (24 * 60 * 60 * 1000)
      ) + 1;
    const length = Math.min(7, remaining);
    const end = addDays(cursor, length - 1);
    const days = eachDayOfInterval({ start: cursor, end });

    weeks.push({
      id: format(cursor, "yyyy-MM-dd"),
      index,
      start: cursor,
      end,
      days,
      label: formatWeekRange(cursor, end),
      shortLabel: `Week ${index} · ${format(cursor, "d MMM")}`,
    });

    cursor = addDays(end, 1);
    index += 1;
  }

  return weeks;
}

export function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth && sameYear) {
    return `${format(start, "d")}–${format(end, "d MMM yyyy")}`;
  }
  if (sameYear) {
    return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
  }
  return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
}

/** Exact column label: Thu 26 Nov 2026 */
export function formatExactDate(day: Date): { weekday: string; dayMonth: string; year: string } {
  return {
    weekday: format(day, "EEE"),
    dayMonth: format(day, "d MMM"),
    year: format(day, "yyyy"),
  };
}

export function findWeekIndexForDate(
  weeks: TrackWeek[],
  day: Date = new Date()
): number {
  const idx = weeks.findIndex((w) =>
    w.days.some((d) => isSameDay(d, startOfDay(day)))
  );
  return idx >= 0 ? idx : 0;
}
