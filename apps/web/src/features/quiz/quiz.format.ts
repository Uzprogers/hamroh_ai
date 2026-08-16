import type { QuizAttempt } from "./quiz.types";

export function accuracyOf(attempt: QuizAttempt): number {
  if (!attempt.total) return 0;
  return Math.round((attempt.correct / attempt.total) * 100);
}

export function secondsOf(ms: number): string {
  return `${Math.round(ms / 100) / 10}s`;
}

export function playedOn(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}
