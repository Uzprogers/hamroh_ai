import { useState } from "react";
import { Modal } from "../../components/Modal";
import { GRADE_OPTIONS, gradeFromName } from "./group.const";
import { TUTOR_COURSES } from "../auth/onboarding.courses";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { Group } from "../../lib/types";

export function GroupDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useI18n();
  const translateError = useTranslateError();
  const { token, user } = useAuth();

  const [form, setForm] = useState<{ name: string; subject: string; grade: number | null }>({
    name: "",
    subject: "",
    grade: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSchool = (user?.institution_type ?? "SCHOOL") === "SCHOOL";
  const namedClass = gradeFromName(form.name) !== null;
  const nameInvalid = isSchool && form.name.trim().length > 0 && !namedClass;
  const ready = form.name.trim().length > 0 && form.subject.trim().length > 0 && !nameInvalid;

  const setName = (name: string) =>
    setForm((prev) => ({ ...prev, name, grade: gradeFromName(name) ?? prev.grade }));

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await api.post<Group>(
        "/groups",
        {
          name: form.name.trim(),
          subject: form.subject.trim(),
          grade_level: form.grade ?? undefined,
          institution_type: user?.institution_type ?? "SCHOOL",
        },
        token,
      );
      onCreated();
      onClose();
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      icon="groups"
      title={t("teacher.newGroup")}
      subtitle={t("teacher.group.subtitle")}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="group_name">
            {t(isSchool ? "teacher.className" : "teacher.groupName")}
          </label>
          <input
            id="group_name"
            className={`field ${nameInvalid ? "border-coral/60" : ""}`}
            value={form.name}
            placeholder="9-A"
            onChange={(event) => setName(event.target.value)}
          />
          {isSchool && (
            <p
              className={`mt-2 text-start text-xs ${nameInvalid ? "text-coral" : "text-muted"}`}
            >
              {t(nameInvalid ? "teacher.className.invalid" : "teacher.className.hint")}
            </p>
          )}
        </div>

        <div>
          <span className="label">{t("teacher.grade")}</span>
          <div className="flex flex-wrap gap-2">
            {GRADE_OPTIONS.map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setForm({ ...form, grade })}
                className={`min-w-9 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  form.grade === grade
                    ? "border-teal/60 bg-gradient-to-r from-teal/25 to-azure/20 text-paper"
                    : "border-edge bg-panel/60 text-muted hover:border-teal/40"
                }`}
              >
                {grade}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, grade: null })}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                form.grade === null
                  ? "border-teal/60 bg-gradient-to-r from-teal/25 to-azure/20 text-paper"
                  : "border-edge bg-panel/60 text-muted hover:border-teal/40"
              }`}
            >
              {t("teacher.grade.any")}
            </button>
          </div>
          <p className="mt-2 text-start text-xs text-muted">{t("teacher.grade.hint")}</p>
        </div>

        <div>
          <label className="label" htmlFor="group_subject">
            {t("teacher.subject")}
          </label>
          <input
            id="group_subject"
            className="field"
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
          />
          <div className="mt-2.5 flex flex-wrap gap-2">
            {TUTOR_COURSES.map((key) => {
              const label = t(key);
              const active = form.subject === label;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, subject: label })}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
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

        {error && (
          <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn-primary w-full"
          onClick={submit}
          disabled={busy || !ready}
        >
          {t("teacher.newGroup")}
        </button>
      </div>
    </Modal>
  );
}
