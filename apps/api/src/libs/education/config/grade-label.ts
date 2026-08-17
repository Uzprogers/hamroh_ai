import { Locale } from "../../../core/i18n/locale.enum";

const GRADE_SUFFIX: Record<Locale, string> = {
  [Locale.UZ]: "-sinf",
  [Locale.RU]: "-класс",
  [Locale.EN]: "-grade",
};

export function gradeLabel(grade: number, locale: Locale): string {
  return `${grade}${GRADE_SUFFIX[locale] ?? GRADE_SUFFIX[Locale.UZ]}`;
}
