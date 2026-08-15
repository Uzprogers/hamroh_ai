import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/i18n";
import { LOCALES, type Locale } from "../i18n/dictionary";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

const flagSrc = (code: Locale) => `/flags/${code.toUpperCase()}.svg`;

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const choose = (next: Locale) => {
    setLocale(next);
    setOpen(false);
    if (token) void api.patch("/auth/locale", { locale: next }, token).catch(() => undefined);
  };

  const current = LOCALES.find((option) => option.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-edge bg-panel/70 px-3 text-sm font-semibold text-paper transition hover:border-teal/50"
      >
        <img src={flagSrc(current.code)} alt="" className="h-5 w-5 rounded-full object-cover" />
        <span className="hidden sm:block">{current.label}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3 w-3 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.146l3.71-3.915a.75.75 0 011.08 1.04l-4.24 4.47a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      <div
        role="menu"
        className={`surface absolute right-0 mt-2 w-44 origin-top-right p-1 transition-all ${
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {LOCALES.map((option) => (
          <button
            key={option.code}
            type="button"
            onClick={() => choose(option.code)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
              option.code === locale ? "bg-teal/10 text-teal" : "text-paper hover:bg-edge/40"
            }`}
          >
            <img src={flagSrc(option.code)} alt="" className="h-5 w-5 rounded-full object-cover" />
            <span className="truncate">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
