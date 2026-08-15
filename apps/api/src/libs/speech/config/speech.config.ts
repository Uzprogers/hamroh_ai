import { Locale } from "../../../core/i18n/locale.enum";

export const STT_LANGUAGE: Record<Locale, string> = {
  [Locale.UZ]: "uz-UZ",
  [Locale.RU]: "ru-RU",
  [Locale.EN]: "en-US",
};

export const TTS_VOICE: Record<Locale, string> = {
  [Locale.UZ]: "yulduz",
  [Locale.RU]: "alena",
  [Locale.EN]: "john",
};

export const SAMPLE_RATE = 16000;
