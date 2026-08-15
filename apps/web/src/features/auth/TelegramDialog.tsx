import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { TelegramSession, TelegramSessionStatus } from "../../lib/types";

const POLL_MS = 2000;

function TelegramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        fill="#2AABEE"
        d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.56 8.24-1.86 8.78c-.14.62-.51.77-1.03.48l-2.85-2.1-1.37 1.32c-.15.15-.28.28-.58.28l.2-2.9 5.3-4.79c.23-.2-.05-.32-.36-.12l-6.55 4.13-2.82-.88c-.61-.2-.62-.61.13-.9l11.02-4.25c.51-.19.96.12.79.95z"
      />
    </svg>
  );
}

export function TelegramDialog({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n();
  const translateError = useTranslateError();
  const { accept } = useAuth();

  const [session, setSession] = useState<TelegramSession | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = async () => {
    setError(null);
    setExpired(false);
    setSession(null);
    setQr(null);

    try {
      const started = await api.post<TelegramSession>("/auth/telegram/session", { locale }, null);
      if (!active.current) return;
      setSession(started);
      setQr(
        await QRCode.toDataURL(started.deep_link, {
          margin: 1,
          width: 320,
          color: { dark: "#0b162a", light: "#ffffff" },
        }),
      );
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
    }
  };

  useEffect(() => {
    void open();
  }, []);

  useEffect(() => {
    if (!session) return;

    const timer = setInterval(async () => {
      try {
        const status = await api.get<TelegramSessionStatus>(
          `/auth/telegram/session/${session.code}`,
          null,
        );
        if (!active.current) return;

        if (status.status === "EXPIRED") {
          setExpired(true);
          clearInterval(timer);
          return;
        }
        if (status.status === "APPROVED" && status.auth) {
          clearInterval(timer);
          accept(status.auth);
        }
      } catch {
        setExpired(true);
        clearInterval(timer);
      }
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [session, accept]);

  const steps = [t("auth.telegram.step1"), t("auth.telegram.step2"), t("auth.telegram.step3")];

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/75 p-5 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="surface relative w-full max-w-[420px] animate-rise overflow-hidden p-7 text-start sm:p-8"
      >
        <span className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-teal/20 via-transparent to-azure/20 opacity-70" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-teal/30 bg-gradient-to-br from-teal/20 to-azure/10">
              <TelegramGlyph />
            </span>
            <div>
              <h3 className="font-display text-xl font-extrabold">{t("auth.telegram.title")}</h3>
              <p className="mt-0.5 text-xs text-muted">{session?.bot_username ?? "…"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("auth.telegram.close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-edge text-muted transition hover:border-coral/50 hover:text-coral"
          >
            ✕
          </button>
        </div>

        {error ? (
          <p className="relative mt-6 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </p>
        ) : (
          <>
            <p className="relative mt-5 text-sm text-muted">{t("auth.telegram.subtitle")}</p>

            <div className="relative mt-5 grid place-items-center">
              <span className="pointer-events-none absolute h-52 w-52 rounded-3xl bg-gradient-to-br from-teal/30 to-azure/30 blur-2xl" />
              <div className="relative rounded-2xl bg-gradient-to-br from-teal/60 to-azure/60 p-[2px]">
                <div className="rounded-[15px] bg-white p-3">
                  {qr ? (
                    <img src={qr} alt="" width={192} height={192} className="h-48 w-48" />
                  ) : (
                    <div className="skeleton h-48 w-48" />
                  )}
                </div>
                {expired && (
                  <div className="absolute inset-0 grid place-items-center rounded-2xl bg-ink/85 text-sm font-semibold text-paper">
                    {t("auth.telegram.expired")}
                  </div>
                )}
              </div>
            </div>

            <ol className="relative mt-6 space-y-2.5">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm text-muted">
                  <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border border-teal/35 bg-teal/10 text-[11px] font-bold text-teal">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            {expired ? (
              <button
                type="button"
                className="btn-primary relative mt-6 w-full"
                onClick={() => void open()}
              >
                {t("auth.telegram.retry")}
              </button>
            ) : (
              <a
                href={session?.deep_link ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="btn-primary relative mt-6 w-full"
              >
                {t("auth.telegram.open")}
              </a>
            )}

            {!expired && (
              <p className="relative mt-4 flex items-center justify-center gap-2 text-xs text-muted">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
                {t("auth.telegram.waiting")}
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
