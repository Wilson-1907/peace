"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssignedTo, Completion, Habit, Profile } from "@/lib/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
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
  demoMode: boolean;
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
  cleanCompletions: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useHabitData(): HabitDataApi {
  const demoMode = !isSupabaseConfigured();
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

    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setReady(true);
      return;
    }

    setCurrentUserId(user.id);

    const { data: me } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const partnerId = me?.partner_id as string | null;
    const ids = [user.id, partnerId].filter(Boolean) as string[];

    const [{ data: profs }, { data: habs }, { data: comps }] = await Promise.all([
      supabase.from("profiles").select("*").in("id", ids),
      supabase.from("habits").select("*").in("user_id", ids).order("sort_order"),
      supabase.from("completions").select("*").in("user_id", ids),
    ]);

    setProfiles((profs as Profile[]) ?? []);
    setHabits((habs as Habit[]) ?? []);
    setCompletions((comps as Completion[]) ?? []);
    setReady(true);
  }, [demoMode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime subscriptions (Supabase only)
  useEffect(() => {
    if (demoMode) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel("habits-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habits" },
        () => void refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completions" },
        () => void refresh()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [demoMode, refresh]);

  const currentUser = useMemo(
    () => profiles.find((p) => p.id === currentUserId) ?? null,
    [profiles, currentUserId]
  );

  const partner = useMemo(() => {
    if (!currentUser?.partner_id) {
      // demo fallback
      const other = profiles.find((p) => p.id !== currentUserId);
      return other ?? null;
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
      // Day-by-day: only today's date can be marked (never Friday early, etc.)
      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (date !== localToday) return;

      if (userId !== currentUserId) return; // hard block partner edits

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

      const supabase = createClient();
      if (!supabase) return;

      const existing = completions.find(
        (c) =>
          c.habit_id === habitId && c.user_id === userId && c.date === date
      );

      // Optimistic capture — UI + compare update in a split second
      const previous = completions;
      let optimistic: Completion[];
      if (existing) {
        optimistic = completions.map((c) =>
          c.id === existing.id ? { ...c, completed: !c.completed } : c
        );
      } else {
        optimistic = [
          ...completions,
          {
            id: `optimistic-${habitId}-${date}`,
            habit_id: habitId,
            user_id: userId,
            date,
            completed: true,
          },
        ];
      }
      setCompletions(optimistic);

      try {
        if (existing) {
          const { error } = await supabase
            .from("completions")
            .update({ completed: !existing.completed })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("completions").insert({
            habit_id: habitId,
            user_id: userId,
            date,
            completed: true,
          });
          if (error) throw error;
        }
        // Soft reconcile without blocking the compare flash
        void refresh();
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

      const supabase = createClient();
      if (!supabase) throw new Error("Storage unavailable");

      const maxOrder = habits
        .filter((h) => h.user_id === currentUserId && h.is_active)
        .reduce((m, h) => Math.max(m, h.sort_order), -1);

      const { error } = await supabase.from("habits").insert({
        user_id: currentUserId,
        name: trimmed,
        assigned_to,
        sort_order: maxOrder + 1,
      });
      if (error) throw new Error(error.message);
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
          const next = archiveDemoHabit(
            { ...base, currentUserId },
            habitId
          );
          setHabits(next.habits);
          return next;
        });
        return;
      }

      const habit = habits.find((h) => h.id === habitId);
      if (!habit || habit.user_id !== currentUserId) return;

      const supabase = createClient();
      if (!supabase) return;

      await supabase
        .from("habits")
        .update({
          is_active: false,
          archived_at: new Date().toISOString(),
        })
        .eq("id", habitId);
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

      const supabase = createClient();
      if (!supabase) return;

      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from("habits").update({ sort_order: index }).eq("id", id)
        )
      );
      await refresh();
    },
    [demoMode, refresh]
  );

  const cleanCompletions = useCallback(async () => {
    if (demoMode) {
      setDemo((prev) => {
        const base = prev ?? loadDemoState();
        const next = clearDemoCompletions(base);
        setCompletions(next.completions);
        return next;
      });
      return;
    }

    const supabase = createClient();
    if (!supabase || !currentUserId) return;

    const ids = completions.map((c) => c.id);
    if (ids.length === 0) return;
    await supabase.from("completions").delete().in("id", ids);
    await refresh();
  }, [demoMode, currentUserId, completions, refresh]);

  return {
    ready,
    demoMode,
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
