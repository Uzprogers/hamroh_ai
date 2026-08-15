import type { CSSProperties } from "react";

const GLYPHS = [
  { char: "∫", top: "18%", left: "12%", size: "56px", delay: "0s", duration: "17s" },
  { char: "π", top: "62%", left: "8%", size: "42px", delay: "2.4s", duration: "21s" },
  { char: "√x", top: "34%", left: "78%", size: "38px", delay: "1.2s", duration: "19s" },
  { char: "Σ", top: "76%", left: "68%", size: "48px", delay: "3.6s", duration: "23s" },
  { char: "A+", top: "12%", left: "58%", size: "34px", delay: "0.8s", duration: "18s" },
  { char: "H₂O", top: "50%", left: "40%", size: "30px", delay: "4.2s", duration: "25s" },
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
      <span className="absolute left-[6%] top-[10%] h-[46vh] w-[46vh] animate-driftA rounded-full bg-teal/30 blur-[90px]" />
      <span className="absolute right-[2%] top-[24%] h-[52vh] w-[52vh] animate-driftB rounded-full bg-azure/30 blur-[110px]" />
      <span className="absolute bottom-[-12%] left-[34%] h-[44vh] w-[44vh] animate-driftC rounded-full bg-teal/20 blur-[120px]" />

      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_45%,rgb(var(--ink)/0.35)_100%)]" />

      {GLYPHS.map((glyph) => (
        <span
          key={glyph.char}
          className="absolute animate-glyphFloat font-mono font-medium text-paper/[0.07]"
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
