import type { CSSProperties } from "react";

const LAYER_ONE =
  "radial-gradient(45% 40% at 18% 22%, rgb(var(--teal) / 0.22), transparent 70%), radial-gradient(50% 42% at 82% 30%, rgb(var(--azure) / 0.2), transparent 70%)";

const LAYER_TWO =
  "radial-gradient(48% 44% at 62% 88%, rgb(var(--teal) / 0.14), transparent 72%), radial-gradient(40% 38% at 30% 70%, rgb(var(--azure) / 0.14), transparent 72%)";

const GLYPHS = [
  { char: "∫", top: "16%", left: "10%", size: "54px", delay: "0s", duration: "19s" },
  { char: "π", top: "64%", left: "6%", size: "40px", delay: "2.4s", duration: "23s" },
  { char: "√x", top: "32%", left: "76%", size: "38px", delay: "1.2s", duration: "20s" },
  { char: "Σ", top: "74%", left: "70%", size: "46px", delay: "3.6s", duration: "25s" },
  { char: "A+", top: "14%", left: "60%", size: "32px", delay: "0.8s", duration: "21s" },
  { char: "H₂O", top: "50%", left: "38%", size: "30px", delay: "4.2s", duration: "27s" },
];

export function Backdrop({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={style}
    >
      <span
        className="absolute -inset-[30%] animate-driftA"
        style={{ backgroundImage: LAYER_ONE }}
      />
      <span
        className="absolute -inset-[30%] animate-driftB"
        style={{ backgroundImage: LAYER_TWO }}
      />

      {GLYPHS.map((glyph) => (
        <span
          key={glyph.char}
          className="absolute animate-glyphFloat font-mono font-medium text-paper/[0.06]"
          style={{
            top: glyph.top,
            left: glyph.left,
            fontSize: glyph.size,
            animationDelay: glyph.delay,
            animationDuration: glyph.duration,
          }}
        >
          {glyph.char}
        </span>
      ))}
    </div>
  );
}
