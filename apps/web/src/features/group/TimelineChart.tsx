import { useState } from "react";
import { clampPercent, formatShortDay } from "./group.format";
import type { StudentTimelinePoint } from "./group.types";

const WIDTH = 320;
const HEIGHT = 140;
const PAD_X = 12;
const PAD_Y = 16;
const GRID = [0, 25, 50, 75, 100];

function toY(percent: number): number {
  return PAD_Y + (1 - clampPercent(percent) / 100) * (HEIGHT - PAD_Y * 2);
}

export function TimelineChart({ points }: { points: StudentTimelinePoint[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (points.length === 0) return null;

  const span = WIDTH - PAD_X * 2;
  const step = points.length > 1 ? span / (points.length - 1) : span;
  const coords = points.map((point, index) => ({
    x: points.length > 1 ? PAD_X + index * step : WIDTH / 2,
    y: toY(point.percent),
  }));

  const line = coords
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const first = coords[0];
  const last = coords[coords.length - 1];
  const area = `${line} L${last.x.toFixed(1)} ${HEIGHT - PAD_Y} L${first.x.toFixed(1)} ${HEIGHT - PAD_Y} Z`;
  const hovered = active === null ? null : points[active];

  return (
    <div className="relative rounded-2xl border border-edge/60 bg-ink/30 p-3">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="presentation">
        <defs>
          <linearGradient id="timelineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--teal))" />
            <stop offset="100%" stopColor="rgb(var(--azure))" />
          </linearGradient>
          <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--teal))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(var(--azure))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {GRID.map((value) => (
          <line
            key={value}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={toY(value)}
            y2={toY(value)}
            stroke="rgb(var(--edge))"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}

        <path d={area} fill="url(#timelineFill)" />
        <path
          d={line}
          fill="none"
          stroke="url(#timelineStroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((point, index) => (
          <circle
            key={points[index].lesson_id + index}
            cx={point.x}
            cy={point.y}
            r={active === index ? 5.5 : 3.5}
            fill="rgb(var(--panel))"
            stroke="rgb(var(--teal))"
            strokeWidth="2.5"
            className="transition-[r] duration-200"
          />
        ))}

        {coords.map((point, index) => (
          <rect
            key={`hit-${points[index].lesson_id}-${index}`}
            x={point.x - step / 2}
            y="0"
            width={step}
            height={HEIGHT}
            fill="transparent"
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(index)}
          />
        ))}
      </svg>

      {hovered && active !== null && (
        <div
          className="pointer-events-none absolute z-10 w-40 -translate-x-1/2 -translate-y-full rounded-xl border border-edge bg-panel px-3 py-2 shadow-lift"
          style={{
            left: `${(coords[active].x / WIDTH) * 100}%`,
            top: `${(coords[active].y / HEIGHT) * 100}%`,
          }}
        >
          <div className="truncate text-start text-[11px] font-semibold">{hovered.topic}</div>
          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <span className="font-mono text-sm text-teal">{hovered.percent}%</span>
            <span className="text-[10px] text-muted">{formatShortDay(hovered.date)}</span>
          </div>
        </div>
      )}

      <div className="mt-2 flex gap-1">
        {points.map((point, index) => (
          <span
            key={`label-${point.lesson_id}-${index}`}
            className="min-w-0 flex-1 truncate text-center text-[9px] text-muted"
            title={point.topic}
          >
            {formatShortDay(point.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
