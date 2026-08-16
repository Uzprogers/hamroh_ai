export type ScanState = "idle" | "starting" | "scanning" | "denied" | "unsupported";

export function pinFromScan(value: string, length: number): string | null {
  const query = value.match(/[?&]pin=(\d+)/);
  const digits = (query?.[1] ?? value).replace(/\D/g, "");
  return digits.length >= length ? digits.slice(0, length) : null;
}
