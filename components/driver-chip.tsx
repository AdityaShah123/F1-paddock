"use client";

import type { Driver, Team } from "@/lib/types";

const SHELL = "#D9D3C6";
const GRAPHITE = "#161A22";
const MARK = "#F4EFE4";

export function HelmetMark({
  number,
  pattern,
  size = 40,
}: {
  number: number;
  colour?: string;
  accent?: string;
  pattern: string;
  size?: number;
}) {
  const w = size;
  const h = size * 0.78;
  return (
    <svg width={w} height={h} viewBox="0 0 40 31" aria-hidden="true">
      <path
        d="M4 20c0-9 7-15.5 17.6-15.5C31 4.5 36 10.4 36 17.4c0 3.2-1.5 5.8-4.8 6.6H9.4C5.8 23.2 4 21.6 4 20Z"
        fill={SHELL}
        stroke={MARK}
        strokeWidth={pattern === "outline" ? 1.8 : 0.6}
      />
      <path d="M7.4 19.2h20.4c.7-4.6-2.2-9.2-9.6-9.2-6.3 0-9.4 3.8-10.8 9.2Z" fill={GRAPHITE} opacity="0.88" />
      <rect x="13" y="5" width="14" height="3.4" rx="0.5" fill={pattern === "stripe" ? GRAPHITE : MARK} />
      {pattern === "dot" ? (
        <>
          <circle cx="11" cy="13" r="1.15" fill={GRAPHITE} />
          <circle cx="16.5" cy="12" r="1.15" fill={GRAPHITE} />
          <circle cx="22" cy="13" r="1.15" fill={GRAPHITE} />
        </>
      ) : null}
      {pattern === "stripe" ? <path d="M8 8.5h22" stroke={GRAPHITE} strokeWidth="1.4" /> : null}
      <text
        x="20"
        y="18.6"
        textAnchor="middle"
        fill="#F4EFE4"
        fontSize="9"
        fontFamily="IBM Plex Mono, ui-monospace, monospace"
      >
        {number}
      </text>
    </svg>
  );
}

export function Portrait({
  driverId,
  alt,
  size = 56,
}: {
  driverId: string;
  colour?: string;
  alt: string;
  size?: number;
}) {
  return (
    <span
      className="portrait-frame relative inline-block overflow-hidden bg-[#2A3140]"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/portraits/${driverId}.jpg`}
        alt={alt}
        width={size}
        height={size}
        className="portrait-img h-full w-full object-cover object-top"
        style={{ filter: "none" }}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </span>
  );
}

export function DriverChip({
  driver,
  teams,
  compact = false,
}: {
  driver: Pick<Driver, "driverId" | "code" | "permanentNumber" | "givenName" | "familyName" | "constructorId">;
  teams: Team[];
  compact?: boolean;
}) {
  const team = teams.find((item) => item.constructorId === driver.constructorId);
  return (
    <div className="flex items-center gap-3">
      <Portrait driverId={driver.driverId} alt="" size={compact ? 40 : 56} />
      <HelmetMark number={driver.permanentNumber} pattern={team?.pattern ?? "solid"} size={compact ? 30 : 40} />
      <span
        className="font-mono tabular-nums tracking-wide text-[#F4EFE4]"
        style={{ fontSize: compact ? 18 : 26 }}
      >
        {driver.permanentNumber}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[11px] tracking-[0.22em] text-[#F4EFE4]">{driver.code}</p>
        <p className="truncate text-[15px] leading-5 text-[#F4EFE4]/88">
          {driver.givenName} {driver.familyName}
        </p>
      </div>
    </div>
  );
}
