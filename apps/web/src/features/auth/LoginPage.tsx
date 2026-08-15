import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
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
    <AuthLayout
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <Link to="/register" className="text-muted transition hover:text-teal">
          {t("auth.toRegister")}
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-5">
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
    </AuthLayout>
  );
}
