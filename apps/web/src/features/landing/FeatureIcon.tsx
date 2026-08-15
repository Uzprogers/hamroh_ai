const PATHS: Record<number, string[]> = {
  1: ["M4 5h16v14H4z", "M8 9h8", "M8 13h5", "M17.6 3.4l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7.7-1.5z"],
  2: ["M4 12.5l4.5 4.5L20 6", "M4 19h8"],
  3: ["M12 4v9", "M12 16.5v.5", "M4.2 19h15.6L12 4.6 4.2 19z"],
  4: ["M4 12a8 8 0 1 1 3.2 6.4L4 20l1.4-3.2A7.9 7.9 0 0 1 4 12z", "M9 11v2", "M12 9.5v5", "M15 11v2"],
  5: ["M12 3l7 3v5.5c0 4.2-2.9 7.6-7 8.5-4.1-.9-7-4.3-7-8.5V6l7-3z", "M9.2 11.8l2 2 3.6-3.8"],
  6: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M3.6 9h16.8", "M3.6 15h16.8", "M12 3c2.5 2.4 3.8 5.5 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.5-3.8-9S9.5 5.4 12 3z"],
};

export function FeatureIcon({ feature }: { feature: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      {(PATHS[feature] ?? []).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
