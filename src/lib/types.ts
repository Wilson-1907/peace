export type AssignedTo = "me" | "partner" | "both";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  partner_id: string | null;
  role: string;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  assigned_to: AssignedTo;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  archived_at: string | null;
}

export interface Completion {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface DayScore {
  date: string;
  completed: number;
  active: number;
  percentage: number;
  missed: string[];
  remark: string;
}

export interface AggregateInsight {
  period: "week" | "month";
  label: string;
  average: number;
  bestDay: string | null;
  worstDay: string | null;
  streak: number;
  insight: string;
}

/** Canonical dual-user identities for the Peace & Wilson couple app */
export const COUPLE = {
  peace: {
    key: "peace" as const,
    name: "Peace",
    photo: "/peace.jpg",
    accent: "#1d4ed8",
  },
  wilson: {
    key: "wilson" as const,
    name: "Wilson",
    photo: "/wilson.jpg",
    accent: "#2563eb",
  },
} as const;

export type CoupleKey = keyof typeof COUPLE;
