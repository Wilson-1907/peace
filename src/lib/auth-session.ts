/**
 * Lightweight couple login — no backend required.
 * Session lives in localStorage so Vercel Hobby can host the whole app free.
 */
import { DEMO_PEACE_ID, DEMO_WILSON_ID } from "./demo-store";

export type PersonKey = "peace" | "wilson";

export interface AuthSession {
  person: PersonKey;
  userId: string;
  displayName: string;
  signedInAt: string;
}

const SESSION_KEY = "pw-auth-session-v1";

export const PEOPLE = {
  peace: {
    key: "peace" as const,
    name: "Peace",
    userId: DEMO_PEACE_ID,
    photo: "/peace.jpg",
    defaultPin: "peace",
  },
  wilson: {
    key: "wilson" as const,
    name: "Wilson",
    userId: DEMO_WILSON_ID,
    photo: "/wilson.jpg",
    defaultPin: "willy1",
  },
} as const;

/** PIN required to run Clean — assigned to Wilson (Willy). */
export const CLEAN_ACTION_PIN = "willy1";

export function verifyCleanPin(pin: string): boolean {
  const expected =
    process.env.NEXT_PUBLIC_CLEAN_PIN?.trim() ||
    process.env.NEXT_PUBLIC_WILSON_PIN?.trim() ||
    CLEAN_ACTION_PIN;
  return pin.trim() === expected;
}

export function getExpectedPin(person: PersonKey): string {
  if (person === "peace") {
    return (
      process.env.NEXT_PUBLIC_PEACE_PIN?.trim() || PEOPLE.peace.defaultPin
    );
  }
  return (
    process.env.NEXT_PUBLIC_WILSON_PIN?.trim() || PEOPLE.wilson.defaultPin
  );
}

export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed?.person !== "peace" && parsed?.person !== "wilson") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(person: PersonKey): AuthSession {
  const meta = PEOPLE[person];
  const session: AuthSession = {
    person,
    userId: meta.userId,
    displayName: meta.name,
    signedInAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function verifyPin(person: PersonKey, pin: string): boolean {
  return pin.trim().toLowerCase() === getExpectedPin(person).toLowerCase();
}
