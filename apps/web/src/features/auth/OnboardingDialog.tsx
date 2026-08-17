import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ClassPicker } from "./ClassPicker";
import { TUTOR_COURSES } from "./onboarding.courses";
import { INSTITUTION_SUGGESTIONS } from "./institutions.data";
import { Avatar } from "../../components/Avatar";
import { Choice } from "../../components/Choice";
import { Combobox } from "../../components/Combobox";
import { StepIcon } from "../../components/StepIcon";
import { useAuth } from "../../lib/auth";
import { api, ApiError } from "../../lib/api";
import { formatPhone } from "../../lib/phone";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";
import type { InstitutionType, Role, School, SchoolClass, User } from "../../lib/types";

const LEVEL_LABEL: Record<InstitutionType, TranslationKey> = {
  SCHOOL: "onboarding.level.school",
  UNIVERSITY: "onboarding.level.university",
  TUTORING: "onboarding.level.tutoring",
};

const INSTITUTION_LABEL: Record<InstitutionType, TranslationKey> = {
  SCHOOL: "onboarding.institution.school",
  UNIVERSITY: "onboarding.institution.university",
  TUTORING: "onboarding.institution.tutoring",
};

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
      className={`relative overflow-hidden rounded-2xl border p-4 text-start transition ${
        selected
          ? "border-teal/70 bg-gradient-to-br from-teal/15 to-azure/10"
          : "border-edge bg-panel/60 hover:-translate-y-0.5 hover:border-teal/40"
      }`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-teal/35 bg-gradient-to-br from-teal/20 to-azure/10 text-teal">
        <StepIcon step={icon} />
      </span>
      <div className="mt-3 font-display text-base font-extrabold">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </button>
  );
}

export function OnboardingDialog({ user }: { user: User }) {
  const { t } = useI18n();
  const translateError = useTranslateError();
  const { completeProfile, logout, token } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [institutionType, setInstitutionType] = useState<InstitutionType>("SCHOOL");
  const [schools, setSchools] = useState<School[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [klass, setKlass] = useState<SchoolClass | null>(null);
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState({
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    institution_name: user.institution_name ?? "",
    grade_level: user.grade_level ?? "",
    subject: user.subject ?? "",
    phone: user.phone ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const phoneRequired = !user.email;
  const catalog = role === "STUDENT" && institutionType === "SCHOOL" && schools.length > 0 && !manual;

  useEffect(() => {
    api
      .get<School[]>("/groups/schools", token)
      .then(setSchools)
      .catch(() => setSchools([]));
  }, [token]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickRole = (next: Role) => {
    setRole(next);
    setStep(2);
  };

  const pickInstitutionType = (next: InstitutionType) => {
    setInstitutionType(next);
    setSchool(null);
    setKlass(null);
    setForm((prev) => ({ ...prev, institution_name: "", grade_level: "" }));
  };

  const pickClass = (nextSchool: School, nextClass: SchoolClass | null) => {
    setSchool(nextSchool);
    setKlass(nextClass);
    setForm((prev) => ({ ...prev, institution_name: nextSchool.name }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!role) return;

    const phone = user.phone ?? form.phone.trim();
    const valid = /^\+998\d{9}$/.test(phone);
    if (phoneRequired ? !valid : Boolean(phone) && !valid) {
      setError(t("onboarding.phone.invalid"));
      return;
    }

    if (catalog && (!school || !klass)) {
      setError(t("onboarding.class.required"));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await completeProfile(
        {
          role,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim() || undefined,
          institution_type: institutionType,
          institution_name: form.institution_name.trim(),
          grade_level: role === "STUDENT" ? form.grade_level.trim() || undefined : undefined,
          subject: role === "TEACHER" ? form.subject.trim() || undefined : undefined,
          phone: valid && phone !== user.phone ? phone : undefined,
        },
        catalog && school && klass ? { school: school.name, class_name: klass.name } : undefined,
      );
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/75 p-4 backdrop-blur-md sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        className="surface relative w-full max-w-[560px] animate-rise p-6 text-start sm:p-8"
      >
        <span className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-teal/20 via-transparent to-azure/20 opacity-70" />

        <div className="relative flex items-center gap-4">
          <Avatar user={user} size="md" ring />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl font-extrabold">
              {t("onboarding.hello").replace("{name}", user.first_name)}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {step === 1 ? t("onboarding.role.subtitle") : t("onboarding.details.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="shrink-0 text-xs font-semibold text-muted transition hover:text-coral"
          >
            {t("auth.logout")}
          </button>
        </div>

        <div className="relative mt-5 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-edge">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal to-azure transition-all duration-500"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
          <span className="chip shrink-0">{t("onboarding.step").replace("{n}", String(step))}</span>
        </div>

        {step === 1 ? (
          <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
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
          <form onSubmit={submit} className="relative mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="ob_first">
                  {t("auth.firstName")}
                </label>
                <input
                  id="ob_first"
                  className="field"
                  value={form.first_name}
                  onChange={(event) => set("first_name", event.target.value)}
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
                  onChange={(event) => set("last_name", event.target.value)}
                />
              </div>
            </div>

            <div>
              <span className="label">{t("auth.institutionType")}</span>
              <Choice
                value={institutionType}
                onChange={pickInstitutionType}
                options={[
                  { value: "SCHOOL", label: t("auth.institution.school") },
                  { value: "UNIVERSITY", label: t("auth.institution.university") },
                  { value: "TUTORING", label: t("auth.institution.tutoring") },
                ]}
              />
            </div>

            {catalog ? (
              <div>
                <span className="label">{t("onboarding.class.title")}</span>
                <p className="mb-2.5 text-xs leading-relaxed text-muted">
                  {t("onboarding.class.hint")}
                </p>
                <ClassPicker schools={schools} school={school} klass={klass} onPick={pickClass} />
                <button
                  type="button"
                  onClick={() => setManual(true)}
                  className="mt-2.5 text-xs font-semibold text-muted transition hover:text-teal"
                >
                  {t("onboarding.class.manual")}
                </button>
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="ob_institution">
                  {t(INSTITUTION_LABEL[institutionType])}
                </label>
                <Combobox
                  id="ob_institution"
                  value={form.institution_name}
                  options={INSTITUTION_SUGGESTIONS[institutionType]}
                  placeholder={t("onboarding.institution.hint")}
                  onChange={(next) => set("institution_name", next)}
                />
                {manual && role === "STUDENT" && institutionType === "SCHOOL" && (
                  <button
                    type="button"
                    onClick={() => setManual(false)}
                    className="mt-2.5 text-xs font-semibold text-muted transition hover:text-teal"
                  >
                    {t("onboarding.class.catalog")}
                  </button>
                )}
              </div>
            )}

            {role === "STUDENT" && institutionType === "TUTORING" ? (
              <div>
                <span className="label">{t(LEVEL_LABEL.TUTORING)}</span>
                <div className="flex flex-wrap gap-2">
                  {TUTOR_COURSES.map((key) => {
                    const label = t(key);
                    const active = form.grade_level === label;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set("grade_level", label)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                          active
                            ? "border-teal/60 bg-gradient-to-r from-teal/25 to-azure/20 text-paper"
                            : "border-edge bg-panel/60 text-muted hover:border-teal/40"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

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
                    onChange={(event) => set("subject", event.target.value)}
                  />
                </div>
              ) : institutionType === "TUTORING" || catalog ? null : (
                <div>
                  <label className="label" htmlFor="ob_grade">
                    {t(LEVEL_LABEL[institutionType])}
                  </label>
                  <input
                    id="ob_grade"
                    className="field"
                    value={form.grade_level}
                    onChange={(event) => set("grade_level", event.target.value)}
                    placeholder={t(
                      institutionType === "SCHOOL"
                        ? "onboarding.level.school.hint"
                        : "onboarding.level.university.hint",
                    )}
                  />
                </div>
              )}

              <div>
                <label className="label" htmlFor="ob_phone">
                  {t(phoneRequired ? "onboarding.phone" : "onboarding.phone.optional")}
                </label>
                {user.phone ? (
                  <input
                    id="ob_phone"
                    className="field cursor-not-allowed opacity-70"
                    value={formatPhone(user.phone)}
                    readOnly
                    disabled
                  />
                ) : (
                  <input
                    id="ob_phone"
                    className="field"
                    value={form.phone}
                    onChange={(event) => set("phone", event.target.value)}
                    placeholder="+998901234567"
                  />
                )}
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
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
    </div>,
    document.body,
  );
}
