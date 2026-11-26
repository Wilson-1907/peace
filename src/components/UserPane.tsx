"use client";

import Image from "next/image";
import { format, parseISO } from "date-fns";
import type {
  AggregateInsight,
  Completion,
  DayScore,
  Habit,
  Profile,
} from "@/lib/types";
import { HabitGrid } from "./HabitGrid";
import { RemarksPanel } from "./RemarksPanel";

interface UserPaneProps {
  profile: Profile;
  photo: string;
  photoPosition?: string;
  habits: Habit[];
  completions: Completion[];
  days: Date[];
  scores: DayScore[];
  weekly: AggregateInsight;
  monthly: AggregateInsight;
  readOnly: boolean;
  isActiveViewer: boolean;
  onSelectViewer: () => void;
  onToggle: (habitId: string, date: string) => void;
}

export function UserPane({
  profile,
  photo,
  photoPosition = "center",
  habits,
  completions,
  days,
  scores,
  weekly,
  monthly,
  readOnly,
  isActiveViewer,
  onSelectViewer,
  onToggle,
}: UserPaneProps) {
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todayScore = scores.find((s) => s.date === todayKey);

  return (
    <section
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        isActiveViewer
          ? "border-blue-500 ring-2 ring-blue-200"
          : "border-blue-100"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-blue-50 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3">
        <button
          type="button"
          onClick={onSelectViewer}
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-blue-200"
          title={`View as ${profile.display_name}`}
        >
          <Image
            src={photo}
            alt={profile.display_name}
            fill
            className="object-cover"
            style={{ objectPosition: photoPosition }}
            sizes="48px"
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-blue-950">
              {profile.display_name}
            </h2>
            {readOnly ? (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                View only
              </span>
            ) : (
              <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                You
              </span>
            )}
          </div>
          <p className="truncate text-xs text-blue-700/70">
            {todayScore
              ? todayScore.remark
              : "No score yet for today"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-blue-700">
            {todayScore ? `${todayScore.percentage}%` : "—"}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-blue-400">
            Today
          </p>
        </div>
      </div>

      <HabitGrid
        habits={habits}
        completions={completions}
        userId={profile.id}
        days={days}
        scores={scores}
        readOnly={readOnly}
        onToggle={onToggle}
      />

      <RemarksPanel
        today={todayScore}
        weekly={weekly}
        monthly={monthly}
        recentScores={scores.filter((s) => {
          const d = parseISO(s.date);
          return d <= new Date() && s.active > 0;
        }).slice(-7)}
      />
    </section>
  );
}
