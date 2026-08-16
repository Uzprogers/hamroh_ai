import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import { LessonPdfButton } from "./LessonPdfButton";
import { PlanStepDialog } from "./PlanStepDialog";
import { NavIcon } from "../../components/NavIcon";
import { MathText } from "../../components/MathText";
import type { TranslationKey } from "../../i18n/dictionary";
import type {
  Assignment,
  GroupSummaryRow,
  Lesson,
  LessonStatus,
  StudentResult,
} from "../../lib/types";

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useI18n();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [summary, setSummary] = useState<GroupSummaryRow[]>([]);
  const [openStudent, setOpenStudent] = useState<string | null>(null);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [openStep, setOpenStep] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ lesson: Lesson; assignments: Assignment[] }>(`/lessons/${id}`, token)
      .then(({ lesson: nextLesson, assignments: nextAssignments }) => {
        setLesson(nextLesson);
        setAssignments(nextAssignments);
        return api.get<GroupSummaryRow[]>(`/groups/${nextLesson.group_id}/summary`, token);
      })
      .then(setSummary)
      .catch(() => undefined);
  }, [id, token]);

  const openResults = async (studentId: string) => {
    if (openStudent === studentId) {
      setOpenStudent(null);
      return;
    }
    setOpenStudent(studentId);
    setStudentResults(await api.get<StudentResult[]>(`/results/student/${studentId}`, token));
  };

  const changeStatus = async (status: LessonStatus) => {
    if (!lesson) return;
    await api.patch(`/lessons/${lesson.id}/status`, { status }, token);
    setLesson({ ...lesson, status });
  };

  if (!lesson) return <div className="skeleton h-64" />;

  const savedMinutes = summary.reduce((sum, row) => sum + row.submissions * 4, 0);

  return (
    <div className="space-y-8">
      <Link to="/" className="chip">
        ← {t("teacher.title")}
      </Link>

      <section className="surface animate-rise p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold">{lesson.topic}</h1>
            <p className="mt-2 max-w-2xl text-muted">{lesson.objective}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`chip ${lesson.status === "ACTIVE" ? "border-teal/40 text-teal" : ""}`}
            >
              {t(`lesson.status.${lesson.status}` as TranslationKey)}
            </span>
            <LessonPdfButton lessonId={lesson.id} />
            <Link to={`/quiz/host/${lesson.id}`} className="btn-ghost">
              <NavIcon name="spark" className="h-4 w-4" />
              {t("quiz.title")}
            </Link>
            {lesson.status === "ACTIVE" ? (
              <button type="button" className="btn-ghost" onClick={() => changeStatus("CLOSED")}>
                {t("lesson.close")}
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => changeStatus("ACTIVE")}>
                {lesson.status === "CLOSED" ? t("lesson.reopen") : t("teacher.publish")}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-6">
          <h2 className="font-display text-lg font-extrabold">{t("teacher.plan")}</h2>
          <ol className="mt-4 space-y-3">
            {lesson.plan.map((step, index) => (
              <li key={step.title}>
                <button
                  type="button"
                  onClick={() => setOpenStep(index)}
                  className="flex w-full gap-4 rounded-xl border border-edge/60 p-4 text-start transition hover:-translate-y-0.5 hover:border-teal/50"
                >
                  <span className="font-mono text-sm text-teal">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold">{step.title}</div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{step.description}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs text-muted">
                    {step.minutes} {t("card.minutes")}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="surface p-6">
          <h2 className="font-display text-lg font-extrabold">{t("teacher.assignments")}</h2>
          <div className="mt-4 space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl border border-edge/60 p-4">
                <div className="flex items-center gap-2">
                  <span className="chip border-azure/40 text-azure">
                  {t(`assignment.type.${assignment.type}` as TranslationKey)}
                </span>
                  <span className="text-xs text-muted">{assignment.max_score} {t("student.score")}</span>
                </div>
                <MathText text={assignment.question} className="mt-3 block text-sm" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignment.criteria.map((criterion) => (
                    <span key={criterion.name} className="chip">
                      {criterion.name} · {criterion.weight}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold">{t("teacher.results")}</h2>
          <span className="chip border-teal/40 text-teal">
            {t("teacher.savedMinutes")}: {savedMinutes} {t("card.minutes")}
          </span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-3">{t("teacher.student")}</th>
                <th className="pb-3">{t("teacher.submissions")}</th>
                <th className="pb-3">{t("teacher.average")}</th>
                <th className="pb-3">{t("teacher.majorMistakes")}</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr
                  key={row.student_id}
                  onClick={() => openResults(row.student_id)}
                  className="cursor-pointer border-t border-edge/50 transition hover:bg-edge/20"
                >
                  <td className="py-3 font-semibold">
                    {row.first_name} {row.last_name}
                  </td>
                  <td className="py-3 text-muted">{row.submissions}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-edge">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal to-azure"
                          style={{ width: `${row.average_percent}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">{row.average_percent}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={row.major_mistakes > 0 ? "text-coral" : "text-muted"}>
                      {row.major_mistakes}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {openStudent && (
          <div className="mt-6 space-y-3 border-t border-edge/50 pt-5">
            {studentResults.map((result) => (
              <div key={result.submission_id} className="rounded-xl border border-edge/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{result.lesson_topic}</span>
                  <span className="font-mono text-sm text-teal">
                    {result.score ?? "—"} / {result.max_score}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{result.feedback}</p>
                {result.mistakes.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {result.mistakes.map((mistake, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded bg-coral/15 px-2 py-0.5 text-coral line-through">
                          {mistake.fragment}
                        </span>
                        <span className="text-muted">→</span>
                        <span className="rounded bg-teal/15 px-2 py-0.5 text-teal">{mistake.correction}</span>
                        <span className="text-xs text-muted">{mistake.explanation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {openStep !== null && (
        <PlanStepDialog plan={lesson.plan} index={openStep} onClose={() => setOpenStep(null)} />
      )}
    </div>
  );
}
