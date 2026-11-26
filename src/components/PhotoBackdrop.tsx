"use client";

import Image from "next/image";

/** Full-viewport couple photo — always visible behind the UI. */
export function PhotoBackdrop({
  dim = "medium",
}: {
  dim?: "light" | "medium" | "heavy";
}) {
  // Keep overlays light so the photo stays visible
  const overlay =
    dim === "light"
      ? "from-blue-950/25 via-blue-900/15 to-blue-950/35"
      : dim === "heavy"
        ? "from-blue-950/55 via-blue-900/40 to-blue-950/60"
        : "from-blue-950/40 via-blue-900/25 to-blue-950/45";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <Image
        src="/couple.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[center_18%]"
        sizes="100vw"
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${overlay}`} />
    </div>
  );
}
