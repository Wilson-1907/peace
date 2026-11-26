"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssignedTo, Completion, Habit, Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { isSharedSyncEnabled } from "@/lib/shared-mode";
import { coupleProfiles } from "@/lib/couple-profiles";
import {
  DEMO_PEACE_ID,
  DEMO_WILSON_ID,
  archiveDemoHabit,
  clearDemoCompletions,
  createDemoHabit,
  loadDemoState,
  reorderDemoHabits,
  saveDemoState,
  toggleDemoCompletion,
  type DemoState,
} from "@/lib/demo-store";

export interface HabitDataApi {
  ready: boolean;
  /** true = localStorage only (this device). false = shared cloud sync. */
  demoMode: boolean;
  sharedMode: boolean;
  currentUser: Profile | null;
  partner: Profile | null;
  profiles: Profile[];
  habits: Habit[];
  completions: Completion[];
  setCurrentUserId: (id: string) => void;
  toggleCompletion: (habitId: string, userId: string, date: string) => Promise<void>;
  createHabit: (name: string, assigned_to: AssignedTo) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  reorderHabits: (orderedIds: string[]) => Promise<void>;
  cleanCompletions: (pin?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useHabitData(): HabitDataApi {
  const sharedMode = isSharedSyncEnabled();
  const demoMode = !sharedMode;
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState<DemoState | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>(DEMO_PEACE_ID);

  const refresh = useCallback(async () => {
    if (demoMode) {
      const state = loadDemoState();
      setDemo(state);
      setProfiles(state.profiles);
      setHabits(state.habits);
      setCompletions(state.completions);
      setCurrentUserId(state.currentUserId);
      setReady(true);
      return;
    }

    // Shared cloud sync — every phone/laptop sees the same data
    const res = await fetch("/api/sync", { cache: "no-store" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      console.error(body.error ?? "Sync failed");
      setProfiles(coupleProfiles());
      setHabits([]);
      setCompletions([]);
      setReady(true);
      return;
    }

    const json = (await res.json()) as {
      profiles: Profile[];
      habits: Habit[];
      completions: Completion[];
    };
    setProfiles(json.profiles?.length ? json.profiles : coupleProfiles());
    setHabits(json.habits ?? []);
    setCompletions(json.completions ?? []);
    setReady(true);
  }, [demoMode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Live updates across devices when shared sync is on
  useEffect(() => {
    if (!sharedMode) return;
    const supabase = createClient();
    if (!supabase) {
      // Poll as fallback if anon client missing
      const id = window.setInterval(() => void refresh(), 8000);
      return () => window.clearInterval(id);
    }

    const channel = supabase
      .channel("shared-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_habits" },
        () => void refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_completions" },
        () => void refresh()
      )
      .subscribe();

    const poll = window.setInterval(() => void refresh(), 15000);

    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [sharedMode, refresh]);

  const currentUser = useMemo(
    () => profiles.find((p) => p.id === currentUserId) ?? null,
    [profiles, currentUserId]
  );

  const partner = useMemo(() => {
    if (!currentUser?.partner_id) {
      return profiles.find((p) => p.id !== currentUserId) ?? null;
    }
    return profiles.find((p) => p.id === currentUser.partner_id) ?? null;
  }, [profiles, currentUser, currentUserId]);

  const setCurrentUserIdWrapped = useCallback(
    (id: string) => {
      setCurrentUserId(id);
      if (!demoMode) return;
      setDemo((prev) => {
        const base = prev ?? loadDemoState();
        const next = { ...base, currentUserId: id };
        saveDemoState(next);
        return next;
      });
    },
    [demoMode]
  );

  const toggleCompletion = useCallback(
    async (habitId: string, userId: string, date: string) => {
      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (date !== localToday) return;
      if (userId !== currentUserId) return;

      if (demoMode) {
        setDemo((prev) => {
          const base = prev ?? loadDemoState();
          const synced = { ...base, currentUserId };
          const next = toggleDemoCompletion(synced, habitId, userId, date);
          setCompletions(next.completions);
          return next;
        });
        return;
      }

      const previous = completions;
      const existing = completions.find(
        (c) =>
          c.habit_id === habitId && c.user_id === userId && c.date === date
      );
      const optimistic: Completion[] = existing
        ? completions.map((c) =>
            c.id === existing.id ? { ...c, completed: !c.completed } : c
          )
        : [
            ...completions,
            {
              id: `optimistic-${habitId}-${date}`,
              habit_id: habitId,
              user_id: userId,
              date,
              completed: true,
            },
          ];
      setCompletions(optimistic);

      try {
        const res = await fetch("/api/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habit_id: habitId, user_id: userId, date }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Toggle failed");
        }
        await refresh();
      } catch {
        setCompletions(previous);
      }
    },
    [demoMode, currentUserId, completions, refresh]
  );

  const createHabit = useCallback(
    async (name: string, assigned_to: AssignedTo) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Enter a habit name");
      if (!currentUserId) throw new Error("Not signed in");

      if (demoMode) {
        setDemo((prev) => {
          const base = prev ?? loadDemoState();
          const synced = { ...base, currentUserId };
          const next = createDemoHabit(synced, {
            name: trimmed,
            assigned_to,
            user_id: currentUserId,
          });
          setHabits(next.habits);
          return next;
        });
        return;
      }

      const maxOrder = habits
        .filter((h) => h.user_id === currentUserId && h.is_active)
        .reduce((m, h) => Math.max(m, h.sort_order), -1);

      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          name: trimmed,
          assigned_to,
          sort_order: maxOrder + 1,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        habit?: Habit;
      };
      if (!res.ok) throw new Error(body.error ?? "Could not add habit");
      await refresh();
    },
    [demoMode, currentUserId, habits, refresh]
  );

  const archiveHabit = useCallback(
    async (habitId: string) => {
      if (demoMode) {
        setDemo((prev) => {
          const base = prev ?? loadDemoState();
          const habit = base.habits.find((h) => h.id === habitId);
          if (!habit || habit.user_id !== currentUserId) return base;
          const next = archiveDemoHabit({ ...base, currentUserId }, habitId);
          setHabits(next.habits);
          return next;
        });
        return;
      }

      const habit = habits.find((h) => h.id === habitId);
      if (!habit || habit.user_id !== currentUserId) return;

      const res = await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: habitId,
          is_active: false,
          archived_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Archive failed");
      }
      await refresh();
    },
    [demoMode, habits, currentUserId, refresh]
  );

  const reorderHabits = useCallback(
    async (orderedIds: string[]) => {
      if (demoMode) {
        setDemo((prev) => {
          const base = prev ?? loadDemoState();
          const next = reorderDemoHabits(base, orderedIds);
          setHabits(next.habits);
          return next;
        });
        return;
      }

      const res = await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: orderedIds.map((id, sort_order) => ({ id, sort_order })),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Reorder failed");
      }
      await refresh();
    },
    [demoMode, refresh]
  );

  const cleanCompletions = useCallback(
    async (pin?: string) => {
      if (demoMode) {
        setDemo((prev) => {
          const base = prev ?? loadDemoState();
          const next = clearDemoCompletions(base);
          setCompletions(next.completions);
          return next;
        });
        return;
      }

      const res = await fetch("/api/completions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin ?? "willy1" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Clean failed");
      }
      await refresh();
    },
    [demoMode, refresh]
  );

  return {
    ready,
    demoMode,
    sharedMode,
    currentUser,
    partner,
    profiles,
    habits,
    completions,
    setCurrentUserId: setCurrentUserIdWrapped,
    toggleCompletion,
    createHabit,
    archiveHabit,
    reorderHabits,
    cleanCompletions,
    refresh,
  };
}

export { DEMO_PEACE_ID, DEMO_WILSON_ID };
