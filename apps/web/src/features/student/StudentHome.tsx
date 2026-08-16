import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import { JoinGroupPanel } from "./JoinGroupPanel";
import type { Lesson, StudentResult } from "../../lib/types";

export function StudentHome() {
  const { token, user } = useAuth();
  const { t } = useI18n();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get<Lesson[]>("/lessons/mine", token),
      api.get<StudentResult[]>("/results/mine", token),
    ])
      .then(([nextLessons, nextResults]) => {
        setLessons(nextLessons);
        setResults(nextResults);
      })
      .catch(() => undefined);
  }, [token, reload]);

  const graded = results.filter((r) => r.score !== null);
  const average = graded.length
    ? Math.round((graded.reduce((sum, r) => sum + (r.score ?? 0) / r.max_score, 0) / graded.length) * 100)
    : 0;

  return (
    <div className="space-y-10">
      <section className="surface animate-rise overflow-hidden p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold">
              {user?.first_name}, <span className="brand-text">Hamroh</span> {t("student.hero.waiting")}
            </h1>
            <p className="mt-2 max-w-lg text-muted">{t("tagline")}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/quiz" className="btn-ghost">
              {t("quiz.title")}
            </Link>
            <Link to="/session" className="btn-primary">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-ink/60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ink" />
              </span>
              {t("student.startSession")}
            </Link>
          </div>
        </div>

        {graded.length > 0 && (
          <div className="mt-7 flex items-center gap-4">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-edge">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal to-azure transition-[width] duration-700"
                style={{ width: `${average}%` }}
              />
            </div>
            <span className="font-mono text-sm text-teal">{average}%</span>
          </div>
        )}
      </section>

      <JoinGroupPanel onJoined={() => setReload((value) => value + 1)} />

      <section>
        <h2 className="mb-4 font-display text-lg font-extrabold">{t("student.myLessons")}</h2>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted">{t("student.empty.lessons")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lessons.map((lesson) => (
              <Link key={lesson.id} to={`/lesson/${lesson.id}`} className="surface tilt p-5">
                <div className="font-semibold">{lesson.topic}</div>
                <p className="mt-2 text-sm text-muted">{lesson.objective}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-extrabold">{t("student.myResults")}</h2>
        {results.length === 0 ? (
          <p className="text-sm text-muted">{t("student.empty.results")}</p>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.submission_id} className="surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">{result.lesson_topic}</div>
                  <span className="font-mono text-sm text-teal">
                    {result.score ?? "—"} / {result.max_score}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{result.feedback}</p>
                {result.mistakes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.mistakes.map((mistake, index) => (
                      <span key={index} className="chip border-coral/30">
                        <span className="text-coral line-through">{mistake.fragment}</span>
                        <span className="text-muted">→</span>
                        <span className="text-teal">{mistake.correction}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
