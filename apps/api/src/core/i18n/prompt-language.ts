import { Locale } from "./locale.enum";

export const LANGUAGE_INSTRUCTION: Record<Locale, string> = {
  [Locale.UZ]: "Barcha matnlarni o'zbek tilida yoz.",
  [Locale.RU]: "Весь текст пиши на русском языке.",
  [Locale.EN]: "Write all text in English.",
};

export const LANGUAGE_NAME: Record<Locale, string> = {
  [Locale.UZ]: "Uzbek",
  [Locale.RU]: "Russian",
  [Locale.EN]: "English",
};
