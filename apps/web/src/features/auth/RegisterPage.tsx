import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthScreen } from "./AuthScreen";
import { SocialButtons } from "./SocialButtons";
import { TelegramDialog } from "./TelegramDialog";
import { Choice } from "../../components/Choice";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/api";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { InstitutionType, Role } from "../../lib/types";

export function RegisterPage() {
  const { t } = useI18n();
  const translateError = useTranslateError();
  const { register } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "+998",
    password: "",
    institution_name: "",
    grade_level: "",
  });
  const [role, setRole] = useState<Role>("STUDENT");
  const [institutionType, setInstitutionType] = useState<InstitutionType>("SCHOOL");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [energy, setEnergy] = useState(0);

  const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({
        ...form,
        grade_level: form.grade_level || undefined,
        role,
        institution_type: institutionType,
      });
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen energy={energy}>
      <div className="surface p-8 sm:p-10">
        <h2 className="font-display text-3xl font-extrabold">{t("auth.register.title")}</h2>
        <p className="mt-1.5 text-sm text-muted">{t("auth.register.subtitle")}</p>

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
            <span className="label">{t("auth.role")}</span>
            <Choice
              value={role}
              onChange={setRole}
              options={[
                { value: "STUDENT", label: t("auth.role.student") },
                { value: "TEACHER", label: t("auth.role.teacher") },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="first_name">
                {t("auth.firstName")}
              </label>
              <input
                id="first_name"
                className="field"
                value={form.first_name}
                onChange={update("first_name")}
              />
            </div>
            <div>
              <label className="label" htmlFor="last_name">
                {t("auth.lastName")}
              </label>
              <input
                id="last_name"
                className="field"
                value={form.last_name}
                onChange={update("last_name")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="reg_phone">
                {t("auth.phone")}
              </label>
              <input id="reg_phone" className="field" value={form.phone} onChange={update("phone")} />
            </div>
            <div>
              <label className="label" htmlFor="reg_password">
                {t("auth.password")}
              </label>
              <input
                id="reg_password"
                type="password"
                className="field"
                value={form.password}
                onChange={update("password")}
              />
            </div>
          </div>

          <div>
            <span className="label">{t("auth.institutionType")}</span>
            <Choice
              value={institutionType}
              onChange={setInstitutionType}
              options={[
                { value: "SCHOOL", label: t("auth.institution.school") },
                { value: "UNIVERSITY", label: t("auth.institution.university") },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="institution_name">
                {t("auth.institutionName")}
              </label>
              <input
                id="institution_name"
                className="field"
                value={form.institution_name}
                onChange={update("institution_name")}
              />
            </div>
            <div>
              <label className="label" htmlFor="grade_level">
                {t("auth.gradeLevel")}
              </label>
              <input
                id="grade_level"
                className="field"
                value={form.grade_level}
                onChange={update("grade_level")}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {t("auth.submit.register")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-muted transition hover:text-teal">
            {t("auth.toLogin")}
          </Link>
        </p>
      </div>

      {telegramOpen && <TelegramDialog onClose={() => setTelegramOpen(false)} />}
    </AuthScreen>
  );
}
