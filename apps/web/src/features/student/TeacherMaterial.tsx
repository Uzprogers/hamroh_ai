import { useState } from "react";
import { MathText } from "../../components/MathText";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";
import type { Assignment, Grade, Lesson } from "../../lib/types";

export function TeacherMaterial({
  lesson,
  assignments,
  onGraded,
}: {
  lesson: Lesson;
  assignments: Assignment[];
  onGraded: () => void;
}) {
  const { token } = useAuth();
  const { t } = useI18n();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, Grade>>({});
  const [checking, setChecking] = useState<string | null>(null);

  const submit = async (assignment: Assignment) => {
    const text = (answers[assignment.id] ?? "").trim();
    if (!text) return;
    setChecking(assignment.id);
    try {
      const { grade } = await api.post<{ grade: Grade }>(
        "/submissions",
        { assignment_id: assignment.id, text },
        token,
      );
      setGrades((prev) => ({ ...prev, [assignment.id]: grade }));
      onGraded();
    } finally {
      setChecking(null);
    }
  };

  return (
    <div className="space-y-5">
      {lesson.plan.length > 0 && (
        <section className="surface p-5 sm:p-6">
          <h2 className="text-start font-display text-sm font-extrabold uppercase tracking-wide text-muted">
            {t("studio.plan")}
          </h2>

          <ol className="mt-4 space-y-2.5">
            {lesson.plan.map((step, index) => (
              <li key={index} className="flex gap-3 rounded-xl border border-edge/60 px-3 py-2.5">
                <span className="font-mono text-xs text-teal">0{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-start text-sm font-semibold">{step.title}</div>
                  <p className="mt-1 text-start text-sm text-muted">{step.description}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {step.minutes} {t("card.minutes")}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {assignments.map((assignment) => {
        const grade = grades[assignment.id];
        return (
          <section key={assignment.id} className="surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border-azure/40 text-azure">
                {t(`assignment.type.${assignment.type}` as TranslationKey)}
              </span>
              <span className="text-xs text-muted">
                {assignment.max_score} {t("student.score")}
              </span>
            </div>

            <p className="mt-3 text-start">
              <MathText text={assignment.question} />
            </p>

            <textarea
              className="field mt-4 min-h-[120px] resize-none"
              placeholder={t("student.answer")}
              value={answers[assignment.id] ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, [assignment.id]: event.target.value }))
              }
            />

            <button
              type="button"
              className="btn-primary mt-4"
              onClick={() => submit(assignment)}
              disabled={checking === assignment.id}
            >
              {checking === assignment.id ? t("student.checking") : t("student.submit")}
            </button>

            {checking === assignment.id && <div className="skeleton mt-5 h-24" />}

            {grade && (
              <div className="mt-5 animate-rise rounded-xl border border-teal/30 bg-teal/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{t("student.feedback")}</span>
                  <span className="font-mono text-lg text-teal">
                    {grade.score} / {grade.max_score}
                  </span>
                </div>
                <p className="mt-2 text-start text-sm text-muted">{grade.feedback}</p>

                {grade.mistakes.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-start text-xs font-semibold uppercase tracking-wide text-muted">
                      {t("student.mistakes")}
                    </div>
                    {grade.mistakes.map((mistake, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded bg-coral/15 px-2 py-0.5 text-coral line-through">
                          {mistake.fragment}
                        </span>
                        <span className="text-muted">→</span>
                        <span className="rounded bg-teal/15 px-2 py-0.5 text-teal">
                          {mistake.correction}
                        </span>
                        <span className="text-xs text-muted">{mistake.explanation}</span>
                      </div>
                    ))}
                  </div>
                )}

                {grade.criteria_results.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {grade.criteria_results.map((criterion) => (
                      <div key={criterion.name} className="flex items-center gap-3 text-xs">
                        <span className="w-32 shrink-0 text-start text-muted">{criterion.name}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal to-azure"
                            style={{ width: `${(criterion.score / criterion.max) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono">
                          {criterion.score}/{criterion.max}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
