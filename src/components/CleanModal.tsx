"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { CLEAN_ACTION_PIN, verifyCleanPin } from "@/lib/auth-session";

interface CleanModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Clean tracking data — only completes when PIN `willy1` (Wilson) is entered.
 */
export function CleanModal({ open, onClose, onConfirm }: CleanModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!verifyCleanPin(pin)) {
      setError("Wrong PIN. Enter willy1 (Wilson) to clean.");
      return;
    }
    onConfirm();
    setPin("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-blue-950/50 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md space-y-4 rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-blue-100">
              <Image
                src="/wilson.jpg"
                alt="Wilson"
                fill
                className="object-cover object-top"
                sizes="48px"
              />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold text-blue-950">
                Clean tracking
              </h3>
              <p className="text-xs text-slate-500">
                Assigned to Wilson · confirm with{" "}
                <code className="text-blue-700">{CLEAN_ACTION_PIN}</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This clears all saved checkmarks for Peace and Wilson. Habits stay.
          This cannot be undone.
        </p>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Wilson PIN to complete
          </span>
          <input
            type="password"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="willy1"
            className="mt-1 w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </label>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Clean now
          </button>
        </div>
      </form>
    </div>
  );
}
