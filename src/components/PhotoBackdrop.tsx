"use client";

import Image from "next/image";

/** Full-viewport couple photo — covers the whole site, not just the hero. */
export function PhotoBackdrop({
  dim = "medium",
}: {
  dim?: "light" | "medium" | "heavy";
}) {
  const overlay =
    dim === "light"
      ? "from-blue-950/45 via-blue-900/35 to-blue-950/55"
      : dim === "heavy"
        ? "from-blue-950/75 via-blue-900/70 to-blue-950/85"
        : "from-blue-950/60 via-blue-900/50 to-blue-950/70";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Image
        src="/couple.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[center_20%]"
        sizes="100vw"
      />
      {/* Soft blue wash so UI stays readable over the full photo */}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlay}`} />
      <div className="absolute inset-0 bg-blue-950/20 backdrop-blur-[1px]" />
    </div>
  );
}
