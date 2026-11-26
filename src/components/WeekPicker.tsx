"use client";

import Image from "next/image";
import { format, isSameDay, startOfDay } from "date-fns";
import type { TrackWeek } from "@/lib/year-calendar";
import clsx from "clsx";

interface WeekPickerProps {
  weeks: TrackWeek[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function WeekPicker({ weeks, activeIndex, onSelect }: WeekPickerProps) {
  const today = startOfDay(new Date());
  const year = today.getFullYear();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-white/25 bg-white/90 shadow-sm backdrop-blur">
        {/* All photo items visible with the calendar plan */}
        <div className="flex flex-wrap items-center gap-3 border-b border-blue-50 px-4 py-3">
          <div className="flex -space-x-2">
            <span className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white">
              <Image
                src="/couple.jpg"
                alt="Peace & Wilson"
                fill
                className="object-cover object-[center_18%]"
                sizes="40px"
              />
            </span>
            <span className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white">
              <Image
                src="/peace.jpg"
                alt="Peace"
                fill
                className="object-cover object-[center_20%]"
                sizes="40px"
              />
            </span>
            <span className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white">
              <Image
                src="/wilson.jpg"
                alt="Wilson"
                fill
                className="object-cover object-top"
                sizes="40px"
              />
            </span>
            <span className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white">
              <Image
                src="/couple-close.jpg"
                alt="Together"
                fill
                className="object-cover"
                sizes="40px"
              />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
              Tracking plan · {year}
            </p>
            <p className="text-sm font-semibold text-blue-950">
              From {format(today, "d MMMM yyyy")} → 31 December {year}
            </p>
            <p className="text-xs text-slate-500">
              Starts today · week by week · marks are saved · next week unlocks
              when this one passes
            </p>
          </div>
          <p className="text-xs font-medium text-blue-700">
            {weeks.length} weeks
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto px-3 py-3">
          {weeks.map((week, i) => {
            const isActive = i === activeIndex;
            const containsToday = week.days.some((d) => isSameDay(d, today));
            const isPast = week.end < today && !containsToday;
            return (
              <button
                key={week.id}
                type="button"
                onClick={() => onSelect(i)}
                className={clsx(
                  "min-w-[9.5rem] shrink-0 rounded-xl border px-3 py-2 text-left transition",
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white shadow"
                    : "border-blue-100 bg-white text-blue-950 hover:border-blue-300",
                  isPast && !isActive && "opacity-70"
                )}
              >
                <p
                  className={clsx(
                    "text-[10px] font-semibold uppercase tracking-wide",
                    isActive ? "text-blue-100" : "text-blue-400"
                  )}
                >
                  Week {week.index}
                  {containsToday ? " · now" : isPast ? " · saved" : ""}
                </p>
                <p className="text-xs font-semibold leading-snug">
                  {week.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
