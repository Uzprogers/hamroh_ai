import { useEffect, useState } from "react";

export interface Bars3DItem {
  id: string;
  label: string;
  value: number;
}

const DEPTH_PX = 12;
const MIN_HEIGHT_PERCENT = 4;
const STEP_MS = 70;
const GRID_LINES = [100, 75, 50, 25];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = () => setReduced(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return reduced;
}

function Bar({ item, grown, delayMs }: { item: Bars3DItem; grown: boolean; delayMs: number }) {
  const height = grown ? Math.max(MIN_HEIGHT_PERCENT, Math.min(100, item.value)) : 0;

  return (
    <div className="group relative flex h-full w-full items-end justify-center">
      <div
        className="relative w-full max-w-[42px] transition-[height,transform] duration-700 ease-out group-hover:-translate-y-1"
        style={{ height: `${height}%`, transitionDelay: `${delayMs}ms` }}
      >
        <span
          className="absolute top-0 h-full bg-gradient-to-b from-azure/70 to-azure/30"
          style={{
            width: `${DEPTH_PX}px`,
            right: `${-DEPTH_PX}px`,
            transform: "skewY(-45deg)",
            transformOrigin: "left top",
          }}
        />
        <span
          className="absolute left-0 w-full bg-teal/70"
          style={{
            height: `${DEPTH_PX}px`,
            top: `${-DEPTH_PX}px`,
            transform: "skewX(-45deg)",
            transformOrigin: "bottom left",
          }}
        />
        <span className="absolute inset-0 rounded-sm bg-gradient-to-t from-azure to-teal shadow-[0_10px_30px_-12px_rgb(var(--teal))]" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 font-mono text-[11px] font-semibold text-paper">
          {item.value}%
        </span>
      </div>
    </div>
  );
}

export function Bars3D({ items }: { items: Bars3DItem[] }) {
  const reduced = usePrefersReducedMotion();
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    if (reduced) {
      setGrown(true);
      return;
    }
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  return (
    <div className="rounded-2xl border border-edge/60 bg-ink/30 p-5">
      <div className="relative h-52 pt-8">
        {GRID_LINES.map((line) => (
          <span
            key={line}
            className="absolute inset-x-0 border-t border-dashed border-edge/50"
            style={{ bottom: `${line * 0.78}%` }}
          />
        ))}
        <div
          className="relative flex h-full items-end gap-3"
          style={{ paddingRight: `${DEPTH_PX}px` }}
        >
          {items.map((item, index) => (
            <Bar
              key={item.id}
              item={item}
              grown={grown}
              delayMs={reduced ? 0 : index * STEP_MS}
            />
          ))}
        </div>
        <span className="absolute inset-x-0 bottom-0 h-px bg-edge" />
      </div>

      <div className="mt-3 flex gap-3" style={{ paddingRight: `${DEPTH_PX}px` }}>
        {items.map((item) => (
          <span
            key={item.id}
            className="min-w-0 flex-1 truncate text-center text-[11px] text-muted"
            title={item.label}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
