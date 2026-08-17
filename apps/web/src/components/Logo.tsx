import { useId } from "react";

export function Logo({ size = 34 }: { size?: number }) {
  const uid = useId();
  const mark = `hamroh-mark-${uid}`;
  const cut = `hamroh-cut-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id={mark} x1="10" y1="6" x2="52" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2AD5C3" />
          <stop offset="1" stopColor="#5586FD" />
        </linearGradient>
        <mask id={cut} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <g fill="#000" stroke="#000" strokeLinecap="round">
            <circle cx="46" cy="33" r="7.5" strokeWidth="6" />
            <path d="M46 46v5" strokeWidth="25" />
          </g>
        </mask>
      </defs>

      <g
        fill={`url(#${mark})`}
        stroke={`url(#${mark})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g mask={`url(#${cut})`}>
          <circle cx="30" cy="15" r="9.5" />
          <path d="M30 27C22 31 19 39 19 50" fill="none" strokeWidth="19" />
          <path d="M34 20C48 23 49 36 39 45" fill="none" strokeWidth="8" />
        </g>

        <circle cx="46" cy="33" r="7.5" />
        <path d="M46 46v5" strokeWidth="19" />
      </g>
    </svg>
  );
}
