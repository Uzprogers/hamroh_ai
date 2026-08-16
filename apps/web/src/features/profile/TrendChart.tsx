import type { TrendPoint } from "../../lib/types";

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const peak = Math.max(1, ...points.map((point) => point.count));

  return (
    <div className="flex h-36 items-end gap-1.5">
      {points.map((point, index) => (
        <div key={point.date} className="group relative flex h-full flex-1 flex-col justify-end">
          <span
            className="w-full rounded-t-md bg-gradient-to-t from-azure/70 to-teal transition-[height] duration-700 ease-out"
            style={{
              height: `${Math.max(4, (point.count / peak) * 100)}%`,
              transitionDelay: `${index * 40}ms`,
            }}
          />
          <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-lg border border-edge bg-panel px-2 py-1 text-[10px] font-semibold opacity-0 transition group-hover:opacity-100">
            {point.count}
          </span>
          <span className="mt-2 text-center text-[9px] text-muted">{point.date.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}
