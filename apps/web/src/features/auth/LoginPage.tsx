import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthScreen } from "./AuthScreen";
import { SocialButtons } from "./SocialButtons";
import { TelegramDialog } from "./TelegramDialog";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/api";
import { useI18n, useTranslateError } from "../../i18n/i18n";

export function LoginPage() {
  const { t } = useI18n();
  const translateError = useTranslateError();
  const { login } = useAuth();

  const [phone, setPhone] = useState("+998");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [energy, setEnergy] = useState(0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(phone, password);
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen energy={energy}>
      <div className="surface p-7 sm:p-9">
        <h2 className="font-display text-3xl font-extrabold">{t("auth.login.title")}</h2>
        <p className="mt-1.5 text-sm text-muted">{t("auth.login.subtitle")}</p>

        <div className="mt-7">
          <SocialButtons onTelegram={() => setTelegramOpen(true)} />
        </div>

        <form
          onSubmit={submit}
          className="mt-6 space-y-5"
          onFocus={() => setEnergy(0.24)}
          onBlur={() => setEnergy(0)}
        >
          <div>
            <label className="label" htmlFor="phone">
              {t("auth.phone")}
            </label>
            <input
              id="phone"
              className="field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901234567"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              {t("auth.password")}
            </label>
            <input
              id="password"
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {t("auth.submit.login")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/register" className="text-muted transition hover:text-teal">
            {t("auth.toRegister")}
          </Link>
        </p>
      </div>

      {telegramOpen && <TelegramDialog onClose={() => setTelegramOpen(false)} />}
    </AuthScreen>
  );
}
