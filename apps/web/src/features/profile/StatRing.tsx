import { useCountUp } from "../../lib/useCountUp";

const RADIUS = 52;
const LENGTH = 2 * Math.PI * RADIUS;

export function StatRing({ percent, label }: { percent: number; label: string }) {
  const value = useCountUp(percent);

  return (
    <div className="relative grid h-32 w-32 shrink-0 place-items-center">
      <span className="pointer-events-none absolute h-28 w-28 rounded-full bg-gradient-to-br from-teal/25 to-azure/25 blur-2xl" />
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="statRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--teal))" />
            <stop offset="100%" stopColor="rgb(var(--azure))" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgb(var(--edge))" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="url(#statRing)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={LENGTH}
          strokeDashoffset={LENGTH * (1 - Math.min(100, percent) / 100)}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-out"
        />
      </svg>
      <div className="absolute grid place-items-center">
        <span className="font-display text-3xl font-extrabold">{value}%</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </span>
      </div>
    </div>
  );
}
