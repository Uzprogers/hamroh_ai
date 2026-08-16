import { useEffect, useState } from "react";

const RADIUS = 42;
const LENGTH = 2 * Math.PI * RADIUS;

export function useRemaining(deadline: number): number {
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline - Date.now()));

  useEffect(() => {
    if (!deadline) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const timer = setInterval(tick, 100);
    return () => clearInterval(timer);
  }, [deadline]);

  return remaining;
}

export function QuizTimer({
  deadline,
  seconds,
  label,
}: {
  deadline: number;
  seconds: number;
  label: string;
}) {
  const remaining = useRemaining(deadline);
  const total = Math.max(1, seconds) * 1000;
  const ratio = Math.min(1, Math.max(0, remaining / total));
  const urgent = ratio <= 0.25;

  return (
    <div className="relative grid h-24 w-24 shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="rgb(var(--edge))" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={urgent ? "rgb(var(--coral))" : "rgb(var(--teal))"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={LENGTH}
          strokeDashoffset={LENGTH * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-100 ease-linear"
        />
      </svg>
      <div className="absolute grid place-items-center">
        <span
          className={`font-display text-2xl font-extrabold ${urgent ? "text-coral" : "text-paper"}`}
        >
          {Math.ceil(remaining / 1000)}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      </div>
    </div>
  );
}
