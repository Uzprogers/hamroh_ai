import { useState, type FormEvent } from "react";
import { AuthScreen } from "./AuthScreen";
import { Choice } from "../../components/Choice";
import { StepIcon } from "../../components/StepIcon";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/api";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { InstitutionType, Role } from "../../lib/types";

function RoleCard({
  title,
  description,
  icon,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  icon: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`tilt relative overflow-hidden rounded-2xl border p-5 text-start transition ${
        selected
          ? "border-teal/70 bg-gradient-to-br from-teal/15 to-azure/10"
          : "border-edge bg-panel/60 hover:border-teal/40"
      }`}
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-teal/35 bg-gradient-to-br from-teal/20 to-azure/10 text-teal">
        <StepIcon step={icon} />
      </span>
      <div className="mt-4 font-display text-lg font-extrabold">{title}</div>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </button>
  );
}

export function OnboardingPage() {
  const { t } = useI18n();
  const translateError = useTranslateError();
  const { user, completeProfile, logout } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [institutionType, setInstitutionType] = useState<InstitutionType>("SCHOOL");
  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    institution_name: user?.institution_name ?? "",
    grade_level: user?.grade_level ?? "",
    subject: user?.subject ?? "",
    phone: user?.phone ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const pickRole = (next: Role) => {
    setRole(next);
    setStep(2);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!role) return;

    setBusy(true);
    setError(null);
    try {
      await completeProfile({
        role,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || undefined,
        institution_type: institutionType,
        institution_name: form.institution_name.trim(),
        grade_level: role === "STUDENT" ? form.grade_level.trim() || undefined : undefined,
        subject: role === "TEACHER" ? form.subject.trim() || undefined : undefined,
        phone: form.phone.trim() && form.phone !== user?.phone ? form.phone.trim() : undefined,
      });
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen energy={0.18}>
      <div className="surface p-8 sm:p-10">
        <div className="flex items-center justify-between gap-3">
          <span className="chip">{t("onboarding.step").replace("{n}", String(step))}</span>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-semibold text-muted transition hover:text-coral"
          >
            {t("auth.logout")}
          </button>
        </div>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-edge">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal to-azure transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        <h2 className="mt-6 font-display text-3xl font-extrabold">
          {t("onboarding.hello").replace("{name}", user?.first_name ?? "")}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {step === 1 ? t("onboarding.role.subtitle") : t("onboarding.details.subtitle")}
        </p>

        {step === 1 ? (
          <div className="mt-7 grid grid-cols-2 gap-3">
            <RoleCard
              icon={1}
              title={t("auth.role.teacher")}
              description={t("onboarding.role.teacher.desc")}
              selected={role === "TEACHER"}
              onSelect={() => pickRole("TEACHER")}
            />
            <RoleCard
              icon={5}
              title={t("auth.role.student")}
              description={t("onboarding.role.student.desc")}
              selected={role === "STUDENT"}
              onSelect={() => pickRole("STUDENT")}
            />
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="ob_first">
                  {t("auth.firstName")}
                </label>
                <input
                  id="ob_first"
                  className="field"
                  value={form.first_name}
                  onChange={update("first_name")}
                />
              </div>
              <div>
                <label className="label" htmlFor="ob_last">
                  {t("auth.lastName")}
                </label>
                <input
                  id="ob_last"
                  className="field"
                  value={form.last_name}
                  onChange={update("last_name")}
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

            <div>
              <label className="label" htmlFor="ob_institution">
                {t("auth.institutionName")}
              </label>
              <input
                id="ob_institution"
                className="field"
                value={form.institution_name}
                onChange={update("institution_name")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {role === "TEACHER" ? (
                <div>
                  <label className="label" htmlFor="ob_subject">
                    {t("onboarding.subject")}
                  </label>
                  <input
                    id="ob_subject"
                    className="field"
                    value={form.subject}
                    onChange={update("subject")}
                  />
                </div>
              ) : (
                <div>
                  <label className="label" htmlFor="ob_grade">
                    {t("auth.gradeLevel")}
                  </label>
                  <input
                    id="ob_grade"
                    className="field"
                    value={form.grade_level}
                    onChange={update("grade_level")}
                  />
                </div>
              )}

              <div>
                <label className="label" htmlFor="ob_phone">
                  {t("onboarding.phone")}
                </label>
                <input
                  id="ob_phone"
                  className="field"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+998901234567"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button type="button" className="btn-ghost px-5" onClick={() => setStep(1)}>
                {t("onboarding.back")}
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                {busy ? t("onboarding.saving") : t("onboarding.finish")}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthScreen>
  );
}
