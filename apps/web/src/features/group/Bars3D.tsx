import { useEffect, useState } from "react";

export interface Bars3DItem {
  id: string;
  label: string;
  value: number;
}

const DEPTH_PX = 16;
const SCENE_TRANSFORM = "rotateX(16deg) rotateY(-17deg)";
const FLAT_TRANSFORM = "rotateX(0deg) rotateY(0deg)";
const MIN_HEIGHT_PERCENT = 5;
const STEP_MS = 70;

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
    <li className="flex min-w-0 flex-1 flex-col items-start gap-2">
      <div className="flex h-40 w-full items-end justify-start [transform-style:preserve-3d]">
        <div
          className="relative w-full max-w-[46px] rounded-t-[4px] transition-[height] duration-700 ease-out [transform-style:preserve-3d]"
          style={{ height: `${height}%`, transitionDelay: `${delayMs}ms` }}
        >
          <span className="absolute inset-0 rounded-t-[4px] bg-gradient-to-t from-azure/70 to-teal shadow-glow" />
          <span
            className="absolute right-0 top-0 h-full origin-right rounded-t-[4px] bg-gradient-to-t from-azure to-azure/60"
            style={{ width: `${DEPTH_PX}px`, transform: "rotateY(90deg)" }}
          />
          <span
            className="absolute left-0 top-0 w-full origin-top rounded-[3px] bg-teal/80"
            style={{ height: `${DEPTH_PX}px`, transform: "rotateX(90deg)" }}
          />
          <span className="absolute -top-6 left-0 font-mono text-[11px] text-muted">
            {item.value}%
          </span>
        </div>
      </div>
      <span className="w-full truncate text-start text-[11px] text-muted">{item.label}</span>
    </li>
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
    <div className="overflow-x-auto" style={{ perspective: "1000px" }}>
      <div
        className="min-w-[420px] rounded-2xl border border-edge/60 bg-ink/30 px-5 pb-4 pt-9"
        style={{
          transform: reduced ? FLAT_TRANSFORM : SCENE_TRANSFORM,
          transformStyle: "preserve-3d",
        }}
      >
        <ul className="flex items-end gap-4 border-b border-edge/70">
          {items.map((item, index) => (
            <Bar
              key={item.id}
              item={item}
              grown={grown}
              delayMs={reduced ? 0 : index * STEP_MS}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
