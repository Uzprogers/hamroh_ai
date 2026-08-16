import { useCallback, useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { ClassCard } from "./ClassCard";
import { JoinCodeDialog } from "./JoinCodeDialog";
import { LessonCards } from "./LessonCards";
import { ResultList } from "./ResultList";
import { STUDENT_NAV } from "./student.nav";
import { NavIcon } from "../../components/NavIcon";
import { Panel } from "../../components/Panel";
import { WorkspaceNav } from "../../components/WorkspaceNav";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { Lesson, StudentGroup, StudentResult } from "../../lib/types";

const OVERVIEW_LIMIT = 4;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="rounded-2xl border border-edge bg-panel/60 px-4 py-2 text-center">
      <span className="block font-display text-xl font-extrabold">{value}</span>
      <span className="block text-[10px] uppercase tracking-wide text-muted">{label}</span>
    </span>
  );
}

export function StudentWorkspace() {
  const { token, user } = useAuth();
  const { t } = useI18n();
  const translateError = useTranslateError();

  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [nextGroups, nextLessons, nextResults] = await Promise.all([
        api.get<StudentGroup[]>("/groups/mine", token),
        api.get<Lesson[]>("/lessons/mine", token),
        api.get<StudentResult[]>("/results/mine", token),
      ]);
      setGroups(nextGroups);
      setLessons(nextLessons);
      setResults(nextResults);
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
    }
  }, [token, translateError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const current = groups[0] ?? null;
  const graded = results.filter((result) => result.score !== null);
  const average = graded.length
    ? Math.round(
        (graded.reduce((sum, result) => sum + (result.score ?? 0) / result.max_score, 0) /
          graded.length) *
          100,
      )
    : 0;

  const counts: Record<string, number> = {
    "/lessons": lessons.length,
    "/results": results.length,
  };

  const openJoin = (
    <button
      type="button"
      className="chip hover:border-teal/50 hover:text-teal"
      onClick={() => setJoining(true)}
    >
      <NavIcon name="key" className="h-3.5 w-3.5" />
      {t(current ? "student.class.change" : "student.class.join")}
    </button>
  );

  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[236px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <WorkspaceNav items={STUDENT_NAV} counts={counts} />

        <div className="mt-3 grid gap-2">
          <Link to="/session" className="btn-primary w-full">
            <NavIcon name="spark" className="h-4 w-4" />
            {t("student.startSession")}
          </Link>
          <Link to="/quiz" className="btn-ghost w-full">
            <NavIcon name="lessons" className="h-4 w-4" />
            {t("quiz.title")}
          </Link>
          <button type="button" className="btn-ghost w-full" onClick={() => setJoining(true)}>
            <NavIcon name="key" className="h-4 w-4" />
            {t(current ? "student.class.change" : "student.class.join")}
          </button>
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        <header className="surface relative overflow-hidden p-5 sm:p-6">
          <span className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-teal/25 to-azure/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-start font-display text-2xl font-extrabold sm:text-3xl">
                {user?.first_name}, <span className="brand-text">Hamroh</span>{" "}
                {t("student.hero.waiting")}
              </h1>
              <p className="mt-1 text-start text-sm text-muted">
                {current ? `${current.name} · ${current.subject}` : t("tagline")}
              </p>
            </div>

            <div className="flex gap-2.5">
              <Stat value={String(lessons.length)} label={t("student.myLessons")} />
              <Stat value={String(graded.length)} label={t("student.stat.done")} />
              <Stat value={`${average}%`} label={t("student.stat.average")} />
            </div>
          </div>

          {graded.length > 0 && (
            <div className="relative mt-5 flex items-center gap-4">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-edge">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal to-azure transition-[width] duration-700"
                  style={{ width: `${average}%` }}
                />
              </div>
              <span className="font-mono text-sm text-teal">{average}%</span>
            </div>
          )}
        </header>

        {error && (
          <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-start text-sm text-coral">
            {error}
          </p>
        )}

        <Routes>
          <Route
            path="/lessons"
            element={
              <Panel title={t("student.myLessons")} aside={openJoin}>
                <LessonCards lessons={lessons} />
              </Panel>
            }
          />
          <Route
            path="/results"
            element={
              <Panel title={t("student.myResults")}>
                <ResultList results={results} />
              </Panel>
            }
          />
          <Route
            path="*"
            element={
              <div className="space-y-4">
                <ClassCard group={current} onOpen={() => setJoining(true)} />
                <Panel
                  title={t("student.myLessons")}
                  aside={
                    lessons.length > OVERVIEW_LIMIT ? (
                      <Link to="/lessons" className="chip hover:border-teal/50 hover:text-teal">
                        {t("student.all")}
                      </Link>
                    ) : undefined
                  }
                >
                  <LessonCards lessons={lessons} limit={OVERVIEW_LIMIT} />
                </Panel>
                <Panel
                  title={t("student.myResults")}
                  aside={
                    results.length > OVERVIEW_LIMIT ? (
                      <Link to="/results" className="chip hover:border-teal/50 hover:text-teal">
                        {t("student.all")}
                      </Link>
                    ) : undefined
                  }
                >
                  <ResultList results={results} limit={OVERVIEW_LIMIT} />
                </Panel>
              </div>
            }
          />
        </Routes>
      </div>

      {joining && (
        <JoinCodeDialog
          current={current?.name ?? null}
          onClose={() => setJoining(false)}
          onJoined={() => void reload()}
        />
      )}
    </div>
  );
}
