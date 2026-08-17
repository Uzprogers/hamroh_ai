import { useEffect, useRef } from "react";
import {
  HOLO_BUSY_LEVEL,
  HOLO_IDLE_LEVEL,
  HOLO_LEVEL_GAIN,
  HOLO_PARTICLES,
  HOLO_SMOOTHING,
  HOLO_SPIN,
} from "./avatar.const";
import type { SessionState } from "./session.types";

const TEAL: [number, number, number] = [42, 213, 195];
const AZURE: [number, number, number] = [85, 134, 253];
const SPARK: [number, number, number] = [143, 251, 236];
const GOLDEN = 2.399963;

type Rgb = [number, number, number];

const rgba = (color: Rgb, alpha: number) =>
  `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;

const mix = (from: Rgb, to: Rgb, ratio: number): Rgb => [
  Math.round(from[0] + (to[0] - from[0]) * ratio),
  Math.round(from[1] + (to[1] - from[1]) * ratio),
  Math.round(from[2] + (to[2] - from[2]) * ratio),
];

export function HologramAvatar({ level, state }: { level: number; state: SessionState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(HOLO_IDLE_LEVEL);
  const smoothRef = useRef(HOLO_IDLE_LEVEL);

  useEffect(() => {
    const busy = state === "THINKING" || state === "BUILDING" || state === "CHECKING";
    targetRef.current =
      state === "SPEAKING"
        ? Math.min(1, level * HOLO_LEVEL_GAIN)
        : busy
          ? HOLO_BUSY_LEVEL
          : HOLO_IDLE_LEVEL;
  }, [level, state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let start = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time: number) => {
      const radius = Math.min(width, height) * 0.29;
      const cx = width / 2;
      const cy = height / 2;
      const energy = smoothRef.current;

      context.clearRect(0, 0, width, height);

      const stage = context.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.7);
      stage.addColorStop(0, "#081426");
      stage.addColorStop(1, "#04070F");
      context.fillStyle = stage;
      context.fillRect(0, 0, width, height);

      const spin = time * HOLO_SPIN;

      for (let index = 0; index < HOLO_PARTICLES; index += 1) {
        const y = 1 - (index / (HOLO_PARTICLES - 1)) * 2;
        const ring = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = index * GOLDEN + spin;
        const push = 1 + energy * 0.32 * Math.sin(index * 0.7 + time * 5);
        const depth = (Math.sin(theta) * ring + 1) / 2;

        const px = cx + Math.cos(theta) * ring * push * radius;
        const py = cy + y * push * radius;

        context.beginPath();
        context.arc(px, py, 0.7 + depth * 1.6, 0, Math.PI * 2);
        context.fillStyle = rgba(mix(AZURE, SPARK, depth), 0.1 + depth * (0.5 + energy * 0.42));
        context.fill();
      }

      const glow = context.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.6);
      glow.addColorStop(0, rgba(TEAL, 0.16 + energy * 0.2));
      glow.addColorStop(1, rgba(TEAL, 0));
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      context.beginPath();
      context.ellipse(cx, cy + radius * 1.5, radius * (0.7 + energy * 0.25), radius * 0.12, 0, 0, Math.PI * 2);
      context.strokeStyle = rgba(TEAL, 0.2 + energy * 0.35);
      context.lineWidth = 1.4;
      context.stroke();
    };

    const loop = (now: number) => {
      if (!start) start = now;
      smoothRef.current += (targetRef.current - smoothRef.current) * HOLO_SMOOTHING;
      draw((now - start) / 1000);
      frame = requestAnimationFrame(loop);
    };

    resize();

    if (reduced) {
      smoothRef.current = HOLO_BUSY_LEVEL;
      draw(0);
    } else {
      frame = requestAnimationFrame(loop);
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0);
    });
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#04070F]">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px)",
        }}
      />
    </div>
  );
}
