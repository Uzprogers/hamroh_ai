import { clampPercent } from "./group.format";

const RADIUS = 40;
const LENGTH = 2 * Math.PI * RADIUS;

export function ShareRing({ percent, label }: { percent: number; label: string }) {
  const value = Math.round(clampPercent(percent));

  return (
    <div className="relative grid h-24 w-24 shrink-0 place-items-center">
      <span className="pointer-events-none absolute h-20 w-20 rounded-full bg-gradient-to-br from-amber/25 to-coral/25 blur-2xl" />
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="shareRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--amber))" />
            <stop offset="100%" stopColor="rgb(var(--coral))" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="rgb(var(--edge))" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke="url(#shareRing)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={LENGTH}
          strokeDashoffset={LENGTH * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-out"
        />
      </svg>
      <div className="absolute grid place-items-center">
        <span className="font-display text-xl font-extrabold">{value}%</span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </span>
      </div>
    </div>
  );
}
