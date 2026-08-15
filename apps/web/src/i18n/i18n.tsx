import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { dictionary, type Locale, type TranslationKey } from "./dictionary";

const STORAGE_KEY = "hamroh.locale";

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (saved && saved in dictionary) return saved;
  const browser = navigator.language.slice(0, 2);
  return browser === "ru" || browser === "en" ? browser : "uz";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => dictionary[locale][key] ?? dictionary.uz[key] ?? key,
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function useTranslateError() {
  const { t } = useI18n();
  return (code: string | undefined) => {
    if (!code) return t("error.unknown");
    const key = `error.${code}` as TranslationKey;
    const translated = dictionary.uz[key] ? t(key) : null;
    return translated ?? code;
  };
}
