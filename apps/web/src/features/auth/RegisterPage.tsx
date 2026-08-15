import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/api";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { InstitutionType, Role } from "../../lib/types";

function Choice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-edge bg-ink/60 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            value === option.value
              ? "bg-gradient-to-r from-teal to-azure text-ink"
              : "text-muted hover:text-paper"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

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
    <AuthLayout
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={
        <Link to="/" className="text-muted transition hover:text-teal">
          {t("auth.toLogin")}
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-5">
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
            <input id="first_name" className="field" value={form.first_name} onChange={update("first_name")} />
          </div>
          <div>
            <label className="label" htmlFor="last_name">
              {t("auth.lastName")}
            </label>
            <input id="last_name" className="field" value={form.last_name} onChange={update("last_name")} />
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
            <input id="grade_level" className="field" value={form.grade_level} onChange={update("grade_level")} />
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {t("auth.submit.register")}
        </button>
      </form>
    </AuthLayout>
  );
}
