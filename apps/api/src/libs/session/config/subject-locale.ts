import { Locale } from "../../../core/i18n/locale.enum";

const SUBJECT_LOCALE: { test: RegExp; locale: Locale }[] = [
  { test: /ingliz|english|англ/i, locale: Locale.EN },
  { test: /\brus\b|russian|русск/i, locale: Locale.RU },
];

export function speechLocaleOf(subject: string): Locale | null {
  const match = SUBJECT_LOCALE.find((entry) => entry.test.test(subject ?? ""));
  return match?.locale ?? null;
}
