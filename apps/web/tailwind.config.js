/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        edge: "rgb(var(--edge) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        teal: "rgb(var(--teal) / <alpha-value>)",
        azure: "rgb(var(--azure) / <alpha-value>)",
        coral: "rgb(var(--coral) / <alpha-value>)",
        amber: "rgb(var(--amber) / <alpha-value>)",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        lift: "var(--shadow-lift)",
        glow: "0 0 60px -12px rgb(var(--teal) / 0.45)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulseRing: {
          "0%": { transform: "scale(.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        previewSweep: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        cardSweep: {
          from: { backgroundPosition: "140% 0" },
          to: { backgroundPosition: "-40% 0" },
        },
        driftA: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(6vw,8vh,0) scale(1.12)" },
        },
        driftB: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1.05)" },
          "50%": { transform: "translate3d(-7vw,-6vh,0) scale(0.92)" },
        },
        driftC: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(0.95)" },
          "50%": { transform: "translate3d(4vw,-9vh,0) scale(1.15)" },
        },
        glyphFloat: {
          "0%, 100%": { transform: "translateY(0) rotate(-3deg)", opacity: "0.35" },
          "50%": { transform: "translateY(-26px) rotate(3deg)", opacity: "1" },
        },
        scanLine: {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "50%": { transform: "translateY(152px)", opacity: "1" },
        },
      },
      animation: {
        rise: "rise .5s cubic-bezier(.2,.8,.2,1) both",
        shimmer: "shimmer 1.6s infinite",
        pulseRing: "pulseRing 2s ease-out infinite",
        previewSweep: "previewSweep 7.6s linear forwards",
        cardSweep: "cardSweep 1.2s cubic-bezier(.4,0,.2,1) forwards",
        driftA: "driftA 26s ease-in-out infinite",
        driftB: "driftB 32s ease-in-out infinite",
        driftC: "driftC 38s ease-in-out infinite",
        glyphFloat: "glyphFloat 20s ease-in-out infinite",
        scanLine: "scanLine 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
