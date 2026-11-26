"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { DayScore } from "@/lib/types";

interface CompareStripProps {
  peaceName: string;
  wilsonName: string;
  peaceScore?: DayScore;
  wilsonScore?: DayScore;
}

/**
 * Instant head-to-head: fires a flash the moment either score changes
 * so capture → compare feels like a split second.
 */
export function CompareStrip({
  peaceName,
  wilsonName,
  peaceScore,
  wilsonScore,
}: CompareStripProps) {
  const peacePct = peaceScore && peaceScore.active > 0 ? peaceScore.percentage : null;
  const wilsonPct =
    wilsonScore && wilsonScore.active > 0 ? wilsonScore.percentage : null;

  const [flash, setFlash] = useState(false);
  const prev = useRef({ peace: peacePct, wilson: wilsonPct });

  useEffect(() => {
    const changed =
      prev.current.peace !== peacePct || prev.current.wilson !== wilsonPct;
    prev.current = { peace: peacePct, wilson: wilsonPct };
    if (!changed) return;

    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 420);
    return () => window.clearTimeout(t);
  }, [peacePct, wilsonPct]);

  const lead =
    peacePct === null || wilsonPct === null
      ? null
      : peacePct === wilsonPct
        ? "tie"
        : peacePct > wilsonPct
          ? "peace"
          : "wilson";

  const peaceShare =
    peacePct === null && wilsonPct === null
      ? 50
      : peacePct === null
        ? 0
        : wilsonPct === null
          ? 100
          : Math.round((peacePct / Math.max(peacePct + wilsonPct, 0.001)) * 100);

  return (
    <div
      className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
        flash ? "compare-flash" : ""
      }`}
    >
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
            Live tracking · today
          </p>
          <p className="text-xs font-medium text-slate-500">
            {lead === "tie" && "Neck and neck"}
            {lead === "peace" && `${peaceName} leads`}
            {lead === "wilson" && `${wilsonName} leads`}
            {lead === null && "Check in to compare"}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
          <Side
            name={peaceName}
            photo="/peace.jpg"
            pct={peacePct}
            align="left"
            flash={flash}
          />
          <span className="font-display text-xs font-bold uppercase tracking-widest text-blue-300">
            vs
          </span>
          <Side
            name={wilsonName}
            photo="/wilson.jpg"
            pct={wilsonPct}
            align="right"
            flash={flash}
          />
        </div>

        <div className="mx-4 mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="flex h-full w-full">
            <div
              className="h-full bg-blue-600 transition-[width] duration-200 ease-out"
              style={{ width: `${peaceShare}%` }}
            />
            <div
              className="h-full bg-sky-400 transition-[width] duration-200 ease-out"
              style={{ width: `${100 - peaceShare}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Side({
  name,
  photo,
  pct,
  align,
  flash,
}: {
  name: string;
  photo: string;
  pct: number | null;
  align: "left" | "right";
  flash: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-blue-100">
        <Image src={photo} alt={name} fill className="object-cover" sizes="36px" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-blue-950">{name}</p>
        <p
          className={`font-display text-xl font-bold tabular-nums text-blue-700 ${
            flash ? "score-snap" : ""
          }`}
        >
          {pct === null ? "—" : `${Math.round(pct)}%`}
        </p>
      </div>
    </div>
  );
}
