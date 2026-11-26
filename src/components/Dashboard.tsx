"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useHabitData } from "@/hooks/useHabitData";
import { computeScoresForDays, habitsVisibleForUser } from "@/lib/scoring";
import {
  buildYearWeeks,
  findWeekIndexForDate,
} from "@/lib/year-calendar";
import {
  clearSession,
  loadSession,
  type AuthSession,
} from "@/lib/auth-session";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Header } from "./Header";
import { UserPane } from "./UserPane";
import { HabitManager } from "./HabitManager";
import { Footer } from "./Footer";
import { CompareStrip } from "./CompareStrip";
import { PhotoBackdrop } from "./PhotoBackdrop";
import { WeekPicker } from "./WeekPicker";
import { generatePeriodInsight } from "@/lib/remarks";

type MobileTab = "peace" | "wilson" | "both";

export function Dashboard() {
  const router = useRouter();
  const data = useHabitData();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("both");

  const weeks = useMemo(() => buildYearWeeks(new Date()), []);
  const [weekIndex, setWeekIndex] = useState(() =>
    findWeekIndexForDate(buildYearWeeks(new Date()), new Date())
  );

  // When the calendar day rolls, jump to the week that contains today
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = findWeekIndexForDate(weeks, new Date());
      setWeekIndex((cur) => (cur === next ? cur : next));
    }, 60_000);
    return () => window.clearInterval(id);
  }, [weeks]);

  const activeWeek = weeks[weekIndex] ?? weeks[0];
  const days = activeWeek?.days ?? [];

  const setCurrentUserId = data.setCurrentUserId;

  useEffect(() => {
    if (isSupabaseConfigured()) {
      setAuthChecked(true);
      return;
    }
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSession(s);
    setCurrentUserId(s.userId);
    setAuthChecked(true);
  }, [router, setCurrentUserId]);

  const peace = data.profiles.find((p) => p.display_name === "Peace");
  const wilson = data.profiles.find((p) => p.display_name === "Wilson");

  const peaceHabits = useMemo(() => {
    if (!peace) return [];
    return habitsVisibleForUser(
      data.habits,
      peace.id,
      data.currentUser?.id === peace.id,
      peace.partner_id
    );
  }, [data.habits, peace, data.currentUser]);

  const wilsonHabits = useMemo(() => {
    if (!wilson) return [];
    return habitsVisibleForUser(
      data.habits,
      wilson.id,
      data.currentUser?.id === wilson.id,
      wilson.partner_id
    );
  }, [data.habits, wilson, data.currentUser]);

  const peaceScores = useMemo(() => {
    if (!peace) return [];
    return computeScoresForDays(
      peaceHabits,
      data.completions,
      peace.id,
      days
    );
  }, [peace, peaceHabits, data.completions, days]);

  const wilsonScores = useMemo(() => {
    if (!wilson) return [];
    return computeScoresForDays(
      wilsonHabits,
      data.completions,
      wilson.id,
      days
    );
  }, [wilson, wilsonHabits, data.completions, days]);

  const yearLabel = `${new Date().getFullYear()}`;

  function weekInsight(scores: typeof peaceScores) {
    const withActivity = scores.filter((s) => s.active > 0);
    const average =
      withActivity.length === 0
        ? 0
        : Math.round(
            (withActivity.reduce((sum, s) => sum + s.percentage, 0) /
              withActivity.length) *
              10
          ) / 10;
    let streak = 0;
    for (let i = withActivity.length - 1; i >= 0; i--) {
      if (withActivity[i].percentage >= 80) streak += 1;
      else break;
    }
    return {
      period: "week" as const,
      label: activeWeek?.shortLabel ?? "This week",
      average,
      bestDay: null,
      worstDay: null,
      streak,
      insight: generatePeriodInsight(
        "week",
        average,
        streak,
        withActivity.length
      ),
    };
  }

  function yearInsight(scores: typeof peaceScores) {
    // reuse week scores as a light stand-in; full year rollup is future work
    return {
      period: "month" as const,
      label: `Through ${yearLabel}`,
      average: weekInsight(scores).average,
      bestDay: null,
      worstDay: null,
      streak: weekInsight(scores).streak,
      insight: `Tracking from today through 31 Dec ${yearLabel}. Past weeks stay saved.`,
    };
  }

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  if (!data.ready || !authChecked || !activeWeek) {
    return (
      <div className="relative flex min-h-screen items-center justify-center text-white">
        <PhotoBackdrop dim="light" />
        <p className="relative z-10 drop-shadow">Loading Peace &amp; Wilson…</p>
      </div>
    );
  }

  const currentId = data.currentUser?.id;
  const todayKey = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="relative min-h-screen">
      <PhotoBackdrop dim="light" />

      <div className="relative z-10">
        <Header
          demoMode={data.demoMode}
          weekLabel={activeWeek.label}
          weekMeta={`Week ${activeWeek.index} of ${weeks.length} · ${yearLabel}`}
          canPrev={weekIndex > 0}
          canNext={weekIndex < weeks.length - 1}
          signedInAs={session?.displayName ?? data.currentUser?.display_name}
          onPrevWeek={() => setWeekIndex((i) => Math.max(0, i - 1))}
          onNextWeek={() =>
            setWeekIndex((i) => Math.min(weeks.length - 1, i + 1))
          }
          onManageHabits={() => setManagerOpen(true)}
          onSignOut={data.demoMode ? signOut : undefined}
        />

        <div className="py-4">
          <WeekPicker
            weeks={weeks}
            activeIndex={weekIndex}
            onSelect={setWeekIndex}
          />
        </div>

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 pb-4 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-white/90 px-3 py-2 text-sm text-blue-900 shadow-sm backdrop-blur">
            <span className="font-semibold">Tracking:</span> start{" "}
            {format(new Date(), "d MMM yyyy")} · mark today only · weeks saved ·
            partner view only
          </div>

          <div className="flex rounded-xl bg-white/90 p-1 shadow-sm backdrop-blur lg:hidden">
            {(
              [
                ["both", "Both"],
                ["peace", "Peace"],
                ["wilson", "Wilson"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMobileTab(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  mobileTab === key
                    ? "bg-blue-600 text-white"
                    : "text-blue-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {peace && wilson && (
          <div className="mb-4">
            <CompareStrip
              peaceName={peace.display_name}
              wilsonName={wilson.display_name}
              peaceScore={peaceScores.find((s) => s.date === todayKey)}
              wilsonScore={wilsonScores.find((s) => s.date === todayKey)}
            />
          </div>
        )}

        <main className="relative mx-auto grid max-w-7xl gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-2 lg:px-8">
          {peace && (mobileTab === "both" || mobileTab === "peace") && (
            <div>
              <UserPane
                profile={peace}
                photo="/peace.jpg"
                photoPosition="center 20%"
                weekLabel={activeWeek.label}
                habits={peaceHabits}
                completions={data.completions}
                days={days}
                scores={peaceScores}
                weekly={weekInsight(peaceScores)}
                monthly={yearInsight(peaceScores)}
                readOnly={currentId !== peace.id}
                isActiveViewer={currentId === peace.id}
                onSelectViewer={() => undefined}
                onToggle={(habitId, date) =>
                  void data.toggleCompletion(habitId, peace.id, date)
                }
              />
            </div>
          )}

          {wilson && (mobileTab === "both" || mobileTab === "wilson") && (
            <div>
              <UserPane
                profile={wilson}
                photo="/wilson.jpg"
                photoPosition="center top"
                weekLabel={activeWeek.label}
                habits={wilsonHabits}
                completions={data.completions}
                days={days}
                scores={wilsonScores}
                weekly={weekInsight(wilsonScores)}
                monthly={yearInsight(wilsonScores)}
                readOnly={currentId !== wilson.id}
                isActiveViewer={currentId === wilson.id}
                onSelectViewer={() => undefined}
                onToggle={(habitId, date) =>
                  void data.toggleCompletion(habitId, wilson.id, date)
                }
              />
            </div>
          )}
        </main>

        {data.currentUser && (
          <HabitManager
            open={managerOpen}
            onClose={() => setManagerOpen(false)}
            habits={data.habits}
            currentUserId={data.currentUser.id}
            onCreate={data.createHabit}
            onArchive={data.archiveHabit}
            onReorder={data.reorderHabits}
          />
        )}

        <Footer />
      </div>
    </div>
  );
}
