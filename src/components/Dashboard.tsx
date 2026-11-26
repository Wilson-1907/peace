"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addMonths, format, subMonths } from "date-fns";
import { useHabitData } from "@/hooks/useHabitData";
import {
  computeMonthScores,
  computeMonthlyInsight,
  computeWeeklyInsight,
  daysInMonth,
  habitsVisibleForUser,
} from "@/lib/scoring";
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

type MobileTab = "peace" | "wilson" | "both";

export function Dashboard() {
  const router = useRouter();
  const data = useHabitData();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cursor, setCursor] = useState(() => new Date());
  const [managerOpen, setManagerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("both");

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const days = useMemo(() => daysInMonth(year, monthIndex), [year, monthIndex]);
  const monthLabel = format(cursor, "MMMM yyyy");

  const setCurrentUserId = data.setCurrentUserId;

  useEffect(() => {
    // Free frontend login (no Supabase). Supabase users skip local PIN gate.
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
    return computeMonthScores(
      peaceHabits,
      data.completions,
      peace.id,
      year,
      monthIndex
    );
  }, [peace, peaceHabits, data.completions, year, monthIndex]);

  const wilsonScores = useMemo(() => {
    if (!wilson) return [];
    return computeMonthScores(
      wilsonHabits,
      data.completions,
      wilson.id,
      year,
      monthIndex
    );
  }, [wilson, wilsonHabits, data.completions, year, monthIndex]);

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  if (!data.ready || !authChecked) {
    return (
      <div className="relative flex min-h-screen items-center justify-center text-white">
        <PhotoBackdrop dim="light" />
        <p className="relative z-10 drop-shadow">Loading Peace &amp; Wilson…</p>
      </div>
    );
  }

  const currentId = data.currentUser?.id;

  return (
    <div className="relative min-h-screen">
      <PhotoBackdrop dim="light" />

      <div className="relative z-10">
      <Header
        demoMode={data.demoMode}
        monthLabel={monthLabel}
        signedInAs={session?.displayName ?? data.currentUser?.display_name}
        onPrevMonth={() => setCursor((c) => subMonths(c, 1))}
        onNextMonth={() => setCursor((c) => addMonths(c, 1))}
        onManageHabits={() => setManagerOpen(true)}
        onSignOut={data.demoMode ? signOut : undefined}
      />

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white/90 px-3 py-2 text-sm text-blue-900 shadow-sm backdrop-blur">
          <span className="font-semibold">Tracking:</span> mark today only ·
          your habits editable · partner{" "}
          <span className="font-semibold">view only</span>
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
            peaceScore={peaceScores.find(
              (s) => s.date === format(new Date(), "yyyy-MM-dd")
            )}
            wilsonScore={wilsonScores.find(
              (s) => s.date === format(new Date(), "yyyy-MM-dd")
            )}
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
              habits={peaceHabits}
              completions={data.completions}
              days={days}
              scores={peaceScores}
              weekly={computeWeeklyInsight(peaceScores)}
              monthly={computeMonthlyInsight(peaceScores, year, monthIndex)}
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
              habits={wilsonHabits}
              completions={data.completions}
              days={days}
              scores={wilsonScores}
              weekly={computeWeeklyInsight(wilsonScores)}
              monthly={computeMonthlyInsight(wilsonScores, year, monthIndex)}
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
