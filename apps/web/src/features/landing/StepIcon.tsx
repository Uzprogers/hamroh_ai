const PATHS: Record<number, string[]> = {
  1: [
    "M4 20h16",
    "M14.5 4.5l5 5L9 20H4v-5L14.5 4.5z",
    "M12 3.2l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9L9.2 6l1.9-.9.9-1.9z",
  ],
  2: [
    "M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
    "M14 3v5h5",
    "M9.5 13.5l2.5-2.5 2.5 2.5",
    "M12 11v6",
  ],
  3: [
    "M12 3l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.4 6.7 19.2l1.1-5.9L3.5 9.2l5.9-.8L12 3z",
    "M9.6 12.2l1.7 1.7 3.3-3.4",
  ],
  4: [
    "M12 4a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0V8a4 4 0 0 1 4-4z",
    "M5 11a7 7 0 0 0 14 0",
    "M12 18v3",
    "M9 21h6",
  ],
};

export function StepIcon({ step }: { step: number }) {
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
      {(PATHS[step] ?? []).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
