import { clampPercent } from "./group.format";

const TONES = {
  cool: "from-teal to-azure",
  warm: "from-amber to-coral",
} as const;

export function MetricBar({
  label,
  value,
  percent,
  tone = "cool",
  delayMs = 0,
}: {
  label: string;
  value: string;
  percent: number;
  tone?: keyof typeof TONES;
  delayMs?: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-start text-sm font-semibold">{label}</span>
        <span className="shrink-0 font-mono text-xs text-muted">{value}</span>
      </div>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-edge">
        <span
          className={`block h-full rounded-full bg-gradient-to-r ${TONES[tone]} transition-[width] duration-700 ease-out`}
          style={{ width: `${clampPercent(percent)}%`, transitionDelay: `${delayMs}ms` }}
        />
      </span>
    </div>
  );
}
