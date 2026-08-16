import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { MathText } from "../../components/MathText";
import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";
import type { Assignment, Grade, Lesson } from "../../lib/types";

export function StudentLessonPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useI18n();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, Grade>>({});
  const [checking, setChecking] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ lesson: Lesson; assignments: Assignment[] }>(`/lessons/${id}`, token)
      .then(({ lesson: nextLesson, assignments: nextAssignments }) => {
        setLesson(nextLesson);
        setAssignments(nextAssignments);
      })
      .catch(() => undefined);
  }, [id, token]);

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
    } finally {
      setChecking(null);
    }
  };

  if (!lesson) return <div className="skeleton h-64" />;

  return (
    <div className="space-y-8">
      <Link to="/" className="chip">
        ← {t("student.title")}
      </Link>

      <section className="surface animate-rise p-7">
        <h1 className="font-display text-3xl font-extrabold">{lesson.topic}</h1>
        <p className="mt-2 text-muted">{lesson.objective}</p>
      </section>

      <div className="space-y-5">
        {assignments.map((assignment) => {
          const grade = grades[assignment.id];
          return (
            <section key={assignment.id} className="surface p-6">
              <div className="flex items-center gap-2">
                <span className="chip border-azure/40 text-azure">
                  {t(`assignment.type.${assignment.type}` as TranslationKey)}
                </span>
                <span className="text-xs text-muted">
                  {assignment.max_score} {t("student.score")}
                </span>
              </div>

              <p className="mt-3"><MathText text={assignment.question} /></p>

              <textarea
                className="field mt-4 min-h-[120px] resize-none"
                placeholder={t("student.answer")}
                value={answers[assignment.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
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
                  <p className="mt-2 text-sm text-muted">{grade.feedback}</p>

                  {grade.mistakes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted">
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
                          <span className="w-32 shrink-0 text-muted">{criterion.name}</span>
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
    </div>
  );
}
