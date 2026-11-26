"use client";

import Image from "next/image";
import { format } from "date-fns";

interface HeaderProps {
  demoMode: boolean;
  monthLabel: string;
  signedInAs?: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onManageHabits: () => void;
  onSignOut?: () => void;
}

export function Header({
  demoMode,
  monthLabel,
  signedInAs,
  onPrevMonth,
  onNextMonth,
  onManageHabits,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="relative border-b border-white/15 bg-white/10 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center -space-x-3">
              <div className="relative z-10 h-16 w-16 overflow-hidden rounded-full ring-[3px] ring-white shadow-lg sm:h-[4.5rem] sm:w-[4.5rem]">
                <Image
                  src="/peace.jpg"
                  alt="Peace"
                  fill
                  className="object-cover object-[center_20%]"
                  sizes="72px"
                  priority
                />
              </div>
              <div className="relative z-0 h-16 w-16 overflow-hidden rounded-full ring-[3px] ring-white shadow-lg sm:h-[4.5rem] sm:w-[4.5rem]">
                <Image
                  src="/wilson.jpg"
                  alt="Wilson"
                  fill
                  className="object-cover object-top"
                  sizes="72px"
                  priority
                />
              </div>
            </div>

            <div>
              <p className="font-display text-2xl font-semibold tracking-tight text-white drop-shadow sm:text-3xl">
                Peace &amp; Wilson
              </p>
              <p className="text-sm text-blue-100/90">
                Habit tracker · {format(new Date(), "EEEE, MMM d")}
                {signedInAs ? ` · signed in as ${signedInAs}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onManageHabits}
              className="rounded-xl bg-white/95 px-3.5 py-2 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-white"
            >
              Manage habits
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-xl border border-white/40 bg-white/15 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
              >
                Sign out
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/90 p-1 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={onPrevMonth}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-50"
              aria-label="Previous month"
            >
              ←
            </button>
            <span className="min-w-[9rem] text-center text-sm font-semibold text-blue-950">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={onNextMonth}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-50"
              aria-label="Next month"
            >
              →
            </button>
          </div>

          {demoMode && (
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-blue-900">
              Free mode · saved on this device
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
