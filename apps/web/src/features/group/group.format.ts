export function formatDay(value: string): string {
  if (!value) return "";
  const raw = value.slice(0, 10);
  if (raw.length !== 10) return "";
  const [year, month, day] = raw.split("-");
  return `${day}.${month}.${year}`;
}

export function formatShortDay(value: string): string {
  const full = formatDay(value);
  return full ? full.slice(0, 5) : "";
}

export function isMajor(severity: string): boolean {
  return severity.toLowerCase() === "major";
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
