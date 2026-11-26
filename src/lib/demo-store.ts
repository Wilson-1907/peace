/**
 * Local demo store used when Supabase env vars are missing.
 * Persists to localStorage so the dual-pane demo works offline.
 */
import type { AssignedTo, Completion, Habit, Profile } from "./types";

const STORAGE_KEY = "pw-habits-demo-v3";

export const DEMO_PEACE_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_WILSON_ID = "00000000-0000-4000-8000-000000000002";

export interface DemoState {
  profiles: Profile[];
  habits: Habit[];
  completions: Completion[];
  currentUserId: string;
}

function seed(): DemoState {
  const now = new Date().toISOString();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(8, 0, 0, 0);

  const profiles: Profile[] = [
    {
      id: DEMO_PEACE_ID,
      display_name: "Peace",
      avatar_url: "/peace.jpg",
      partner_id: DEMO_WILSON_ID,
      role: "member",
      created_at: now,
    },
    {
      id: DEMO_WILSON_ID,
      display_name: "Wilson",
      avatar_url: "/wilson.jpg",
      partner_id: DEMO_PEACE_ID,
      role: "member",
      created_at: now,
    },
  ];

  const habits: Habit[] = [
    {
      id: "h-p-1",
      user_id: DEMO_PEACE_ID,
      name: "Morning prayer",
      assigned_to: "me",
      is_active: true,
      sort_order: 0,
      created_at: monthStart.toISOString(),
      archived_at: null,
    },
    {
      id: "h-p-2",
      user_id: DEMO_PEACE_ID,
      name: "Read 20 pages",
      assigned_to: "both",
      is_active: true,
      sort_order: 1,
      created_at: monthStart.toISOString(),
      archived_at: null,
    },
    {
      id: "h-p-3",
      user_id: DEMO_PEACE_ID,
      name: "Sleep by 11:00 PM",
      assigned_to: "me",
      is_active: true,
      sort_order: 2,
      created_at: monthStart.toISOString(),
      archived_at: null,
    },
    {
      id: "h-w-1",
      user_id: DEMO_WILSON_ID,
      name: "Workout",
      assigned_to: "me",
      is_active: true,
      sort_order: 0,
      created_at: monthStart.toISOString(),
      archived_at: null,
    },
    {
      id: "h-w-2",
      user_id: DEMO_WILSON_ID,
      name: "No junk food",
      assigned_to: "me",
      is_active: true,
      sort_order: 1,
      created_at: monthStart.toISOString(),
      archived_at: null,
    },
    {
      id: "h-w-3",
      user_id: DEMO_WILSON_ID,
      name: "Deep work 2hrs",
      assigned_to: "both",
      is_active: true,
      sort_order: 2,
      created_at: monthStart.toISOString(),
      archived_at: null,
    },
  ];

  return {
    profiles,
    habits,
    completions: [],
    currentUserId: DEMO_PEACE_ID,
  };
}

export function loadDemoState(): DemoState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as DemoState;
  } catch {
    return seed();
  }
}

export function saveDemoState(state: DemoState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createDemoHabit(
  state: DemoState,
  input: {
    name: string;
    assigned_to: AssignedTo;
    user_id: string;
  }
): DemoState {
  const maxOrder = state.habits
    .filter((h) => h.user_id === input.user_id && h.is_active)
    .reduce((m, h) => Math.max(m, h.sort_order), -1);

  const habit: Habit = {
    id: crypto.randomUUID(),
    user_id: input.user_id,
    name: input.name.trim(),
    assigned_to: input.assigned_to,
    is_active: true,
    sort_order: maxOrder + 1,
    created_at: new Date().toISOString(),
    archived_at: null,
  };

  const next = { ...state, habits: [...state.habits, habit] };
  saveDemoState(next);
  return next;
}

export function archiveDemoHabit(state: DemoState, habitId: string): DemoState {
  const next: DemoState = {
    ...state,
    habits: state.habits.map((h) =>
      h.id === habitId
        ? {
            ...h,
            is_active: false,
            archived_at: new Date().toISOString(),
          }
        : h
    ),
  };
  saveDemoState(next);
  return next;
}

export function reorderDemoHabits(
  state: DemoState,
  orderedIds: string[]
): DemoState {
  const next: DemoState = {
    ...state,
    habits: state.habits.map((h) => {
      const idx = orderedIds.indexOf(h.id);
      return idx === -1 ? h : { ...h, sort_order: idx };
    }),
  };
  saveDemoState(next);
  return next;
}

/** Wipe all completion marks; keep habits + profiles. */
export function clearDemoCompletions(state: DemoState): DemoState {
  const next: DemoState = { ...state, completions: [] };
  saveDemoState(next);
  return next;
}

/** Full reset to seed habits with empty tracking. */
export function resetDemoTracking(state: DemoState): DemoState {
  const fresh = seed();
  fresh.currentUserId = state.currentUserId;
  saveDemoState(fresh);
  return fresh;
}

export function toggleDemoCompletion(
  state: DemoState,
  habitId: string,
  userId: string,
  date: string
): DemoState {
  const existing = state.completions.find(
    (c) =>
      c.habit_id === habitId && c.user_id === userId && c.date === date
  );

  let completions: Completion[];
  if (existing) {
    completions = state.completions.map((c) =>
      c.id === existing.id ? { ...c, completed: !c.completed } : c
    );
  } else {
    completions = [
      ...state.completions,
      {
        id: crypto.randomUUID(),
        habit_id: habitId,
        user_id: userId,
        date,
        completed: true,
      },
    ];
  }

  const next = { ...state, completions };
  saveDemoState(next);
  return next;
}
