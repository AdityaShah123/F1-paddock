import type { Driver } from "@/lib/types";
import { patternDash, patternFillOpacity, teamById } from "@/lib/teams";
import type { Team } from "@/lib/types";

type DriverFormProps = {
  driver: Driver;
  teams: Team[];
  size?: number;
  featured?: boolean;
};

export function DriverForm({ driver, teams, size = 132, featured = false }: DriverFormProps) {
  const team = teamById(teams, driver.constructorId);
  const cx = size / 2;
  const cy = size / 2;
  const inner = size * 0.16;
  const outer = size * 0.42;
  const trace = driver.speedTrace.length ? driver.speedTrace : [0.2, 0.4, 0.3];
  const points = trace.map((speed, index) => {
    const angle = (index / trace.length) * Math.PI * 2 - Math.PI / 2;
    const radius = inner + speed * (outer - inner);
    return `${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`;
  });
  const dash = patternDash(team.pattern);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${driver.givenName} ${driver.familyName} speed form`}
      >
        <circle
          cx={cx}
          cy={cy}
          r={outer + 4}
          fill="none"
          stroke={team.colour}
          strokeOpacity={0.18}
        />
        <polygon
          points={points.join(" ")}
          fill={team.colour}
          fillOpacity={patternFillOpacity(team.pattern)}
          stroke={team.colour}
          strokeWidth={featured ? 2.2 : 1.4}
          strokeDasharray={dash}
        />
        {team.pattern === "stripe" ? (
          <polygon
            points={points.join(" ")}
            fill="none"
            stroke={team.accent}
            strokeWidth={0.9}
            strokeDasharray="2 9"
            opacity={0.9}
          />
        ) : null}
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fill="#E8E2D4"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize={featured ? 18 : 13}
        >
          {driver.permanentNumber}
        </text>
      </svg>
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-[0.16em] text-[#E8E2D4]">
          {driver.code}
        </p>
        <p className="font-[family-name:var(--font-archivo)] text-xs text-[#E8E2D4]/70">
          {driver.familyName}
        </p>
      </div>
    </div>
  );
}

export function HelmetMark({
  number,
  colour,
  accent,
  pattern,
}: {
  number: number;
  colour: string;
  accent: string;
  pattern: string;
}) {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" aria-hidden="true">
      <path
        d="M4 18c0-8 6.2-14 16-14 8.4 0 13 5.2 13 11.4 0 3-1.4 5.4-4.4 6.2H9.2C5.8 21 4 19.6 4 18Z"
        fill={colour}
        stroke={accent}
        strokeWidth={pattern === "outline" ? 1.6 : 0.6}
      />
      <path d="M7 17h18c.6-4.2-2-8.4-8.6-8.4C10.2 8.6 7.4 12 7 17Z" fill="#0b0c0e" opacity="0.55" />
      <rect x="12" y="4.2" width="12" height="3.2" rx="0.6" fill={pattern === "stripe" ? accent : "#E8E2D4"} />
      {pattern === "dot" ? (
        <>
          <circle cx="10" cy="12" r="1.1" fill={accent} />
          <circle cx="15" cy="11" r="1.1" fill={accent} />
          <circle cx="20" cy="12" r="1.1" fill={accent} />
        </>
      ) : null}
      <text
        x="18"
        y="24.5"
        textAnchor="middle"
        fill="#E8E2D4"
        fontSize="7"
        fontFamily="IBM Plex Mono, ui-monospace, monospace"
      >
        {number}
      </text>
    </svg>
  );
}
