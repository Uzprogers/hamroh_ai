export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id="hamroh-mark" x1="10" y1="6" x2="52" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2AD5C3" />
          <stop offset="1" stopColor="#5586FD" />
        </linearGradient>
      </defs>
      <circle cx="27" cy="14" r="8" fill="url(#hamroh-mark)" />
      <path
        d="M27 24c-8 0-13 6-13 14v18a5 5 0 0 0 10 0V40"
        stroke="url(#hamroh-mark)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="44" cy="30" r="6" fill="url(#hamroh-mark)" />
      <path
        d="M44 38c-5 0-8 4-8 9v9a4 4 0 0 0 8 0"
        stroke="url(#hamroh-mark)"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}
