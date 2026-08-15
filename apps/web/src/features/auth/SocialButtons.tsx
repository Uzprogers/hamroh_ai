import { useState, type ReactNode } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/api";
import { useI18n, useTranslateError } from "../../i18n/i18n";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fill="#2AABEE"
        d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.56 8.24-1.86 8.78c-.14.62-.51.77-1.03.48l-2.85-2.1-1.37 1.32c-.15.15-.28.28-.58.28l.2-2.9 5.3-4.79c.23-.2-.05-.32-.36-.12l-6.55 4.13-2.82-.88c-.61-.2-.62-.61.13-.9l11.02-4.25c.51-.19.96.12.79.95z"
      />
    </svg>
  );
}

function ProviderButton({
  icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-4 rounded-2xl border border-edge bg-panel/60 px-4 py-4 text-start transition hover:border-teal/50 hover:bg-panel disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-edge bg-ink/60 transition group-hover:border-teal/40">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-extrabold">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span
        aria-hidden="true"
        className="text-muted transition group-hover:translate-x-0.5 group-hover:text-teal"
      >
        →
      </span>
    </button>
  );
}

export function SocialButtons({ onTelegram }: { onTelegram: () => void }) {
  const { t } = useI18n();
  const translateError = useTranslateError();
  const { loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGoogle = useGoogleLogin({
    onSuccess: async (response) => {
      setBusy(true);
      setError(null);
      try {
        await loginWithGoogle(response.access_token);
      } catch (err) {
        setError(translateError(err instanceof ApiError ? err.code : "network"));
      } finally {
        setBusy(false);
      }
    },
    onError: () => setError(translateError("unknown")),
  });

  return (
    <div className="space-y-3">
      <ProviderButton
        icon={<TelegramMark />}
        label="Telegram"
        hint={t("auth.provider.telegram")}
        onClick={onTelegram}
      />
      <ProviderButton
        icon={<GoogleMark />}
        label="Google"
        hint={t("auth.provider.google")}
        onClick={() => startGoogle()}
        disabled={busy}
      />

      {error && (
        <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
