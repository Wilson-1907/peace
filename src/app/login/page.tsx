"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PhotoBackdrop } from "@/components/PhotoBackdrop";
import { Footer } from "@/components/Footer";
import {
  PEOPLE,
  clearSession,
  loadSession,
  saveSession,
  verifyPin,
  type PersonKey,
} from "@/lib/auth-session";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [person, setPerson] = useState<PersonKey>("peace");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Supabase path (optional paid/free-tier backend)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabaseMode = isSupabaseConfigured();

  useEffect(() => {
    const existing = loadSession();
    if (existing && !supabaseMode) {
      router.replace("/");
    }
  }, [router, supabaseMode]);

  async function onLocalSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!verifyPin(person, pin)) {
        setError("Wrong PIN for that person. Try again.");
        return;
      }
      saveSession(person);
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onSupabaseSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    if (!supabase) return;
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
      clearSession();
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <PhotoBackdrop dim="heavy" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <form
          onSubmit={supabaseMode ? onSupabaseSubmit : onLocalSubmit}
          className="w-full max-w-md space-y-5 rounded-3xl border border-white/25 bg-white/90 p-6 shadow-2xl backdrop-blur-md"
        >
          <div className="text-center">
            <div className="mx-auto mb-3 flex justify-center -space-x-3">
              <span className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-white shadow">
                <Image
                  src="/peace.jpg"
                  alt="Peace"
                  fill
                  className="object-cover object-[center_20%]"
                  sizes="56px"
                />
              </span>
              <span className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-white shadow">
                <Image
                  src="/wilson.jpg"
                  alt="Wilson"
                  fill
                  className="object-cover object-top"
                  sizes="56px"
                />
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-blue-950">
              Peace &amp; Wilson
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {supabaseMode
                ? "Sign in with your account"
                : "Choose who you are, then enter your PIN"}
            </p>
          </div>

          {!supabaseMode && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PEOPLE) as PersonKey[]).map((key) => {
                  const p = PEOPLE[key];
                  const active = person === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPerson(key)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 transition ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white shadow-md"
                          : "border-blue-100 bg-white text-blue-900 hover:border-blue-300"
                      }`}
                    >
                      <span className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/80">
                        <Image
                          src={p.photo}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </span>
                      <span className="text-sm font-semibold">{p.name}</span>
                    </button>
                  );
                })}
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Your PIN
                </span>
                <input
                  type="password"
                  inputMode="text"
                  autoComplete="current-password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder={`PIN for ${PEOPLE[person].name}`}
                  className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <p className="text-center text-[11px] text-slate-400">
                Default PINs: Peace → <code className="text-blue-600">peace</code>
                {" · "}
                Wilson → <code className="text-blue-600">wilson</code>
              </p>
            </>
          )}

          {supabaseMode && (
            <>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </>
          )}

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : `Continue as ${PEOPLE[person].name}`}
          </button>
        </form>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
