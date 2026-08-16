const PATHS = {
  overview: ["M4 12l8-7 8 7", "M6 10.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5", "M10 20v-5h4v5"],
  groups: [
    "M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11z",
    "M3 19.5c0-3 2.7-4.8 6-4.8s6 1.8 6 4.8",
    "M16 5.2a3 3 0 0 1 0 5.8",
    "M17.5 14.9c2.1.5 3.5 1.9 3.5 4.6",
  ],
  lessons: [
    "M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5v-12z",
    "M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 0 1.5-1.5v-12z",
    "M11 19h2",
  ],
  stats: ["M4 20h16", "M7 20v-6", "M12 20V7", "M17 20v-9"],
  plus: ["M12 5v14", "M5 12h14"],
  spark: [
    "M12 3.5l1.7 3.9 3.9 1.7-3.9 1.7L12 14.7l-1.7-3.9L6.4 9.1l3.9-1.7L12 3.5z",
    "M18 15l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8.8-1.8z",
  ],
  close: ["M6 6l12 12", "M18 6L6 18"],
  chevron: ["M9.5 6l6 6-6 6"],
  caret: ["M6 9.5l6 6 6-6"],
  check: ["M5 12.5l4.5 4.5L19 7"],
} as const;

export type NavIconName = keyof typeof PATHS;

export function NavIcon({ name, className = "h-5 w-5" }: { name: NavIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
