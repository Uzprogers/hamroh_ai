export enum Locale {
  UZ = "uz",
  RU = "ru",
  EN = "en",
}

export const DEFAULT_LOCALE = Locale.UZ;

export const LOCALE_NAMES: Record<Locale, string> = {
  [Locale.UZ]: "O'zbekcha",
  [Locale.RU]: "Русский",
  [Locale.EN]: "English",
};
