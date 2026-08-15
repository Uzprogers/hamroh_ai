import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { TelegramSession, TelegramSessionStatus } from "../../lib/types";

const POLL_MS = 2000;

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

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-5 backdrop-blur-sm">
      <div className="surface w-full max-w-[400px] animate-rise p-7 text-start">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-extrabold">{t("auth.telegram.title")}</h3>
            <p className="mt-1 text-sm text-muted">{t("auth.telegram.subtitle")}</p>
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
          <p className="mt-6 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </p>
        ) : (
          <>
            <div className="mt-6 grid place-items-center">
              <div className="relative rounded-2xl border border-edge bg-white p-3">
                {qr ? (
                  <img src={qr} alt="" width={192} height={192} className="h-48 w-48" />
                ) : (
                  <div className="skeleton h-48 w-48" />
                )}
                {expired && (
                  <div className="absolute inset-0 grid place-items-center rounded-2xl bg-ink/85 text-sm font-semibold text-paper">
                    {t("auth.telegram.expired")}
                  </div>
                )}
              </div>
            </div>

            <ol className="mt-6 space-y-2 text-sm text-muted">
              <li>1. {t("auth.telegram.step1")}</li>
              <li>2. {t("auth.telegram.step2")}</li>
              <li>3. {t("auth.telegram.step3")}</li>
            </ol>

            {expired ? (
              <button type="button" className="btn-primary mt-6 w-full" onClick={() => void open()}>
                {t("auth.telegram.retry")}
              </button>
            ) : (
              <a
                href={session?.deep_link ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="btn-primary mt-6 w-full"
              >
                {t("auth.telegram.open")}
              </a>
            )}

            {!expired && (
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
                {t("auth.telegram.waiting")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
