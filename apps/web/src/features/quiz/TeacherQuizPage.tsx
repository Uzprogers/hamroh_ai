import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import { QuizBars, type BarDatum } from "./QuizBars";
import { MathText } from "../../components/MathText";
import { QuizJoinCode } from "./QuizJoinCode";
import { QuizLeaderboard } from "./QuizLeaderboard";
import { QuizTimer } from "./QuizTimer";
import { useQuizRoom } from "./useQuizRoom";
import { quizErrorKey } from "./quiz.errors";
import { QUIZ_TILE_BAR, QUIZ_TILE_GLYPH, QUIZ_TILE_STYLE } from "./quiz.const";
import type { QuizSummary } from "./quiz.types";

export function TeacherQuizPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { token } = useAuth();
  const { t } = useI18n();

  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [creating, setCreating] = useState(true);

  useEffect(() => {
    if (!lessonId || !token) return;
    setCreating(true);
    api
      .post<QuizSummary>("/quiz/sessions", { lesson_id: lessonId }, token)
      .then(setSummary)
      .catch((error) => setFailure(error instanceof ApiError ? error.code : "unknown"))
      .finally(() => setCreating(false));
  }, [lessonId, token]);

  const room = useQuizRoom(summary?.pin ?? null);
  const { state, results, reveal, counts, answered } = room;

  const questionBars: BarDatum[] = useMemo(() => {
    const options = state?.question?.options ?? [];
    return options.map((option, index) => ({
      key: `${index}-${option}`,
      label: `${QUIZ_TILE_GLYPH[index]} · ${option}`,
      value: counts[index] ?? 0,
      barClass: QUIZ_TILE_BAR[index],
      highlight: reveal?.correct_index === index,
    }));
  }, [state?.question, counts, reveal]);

  const resultBars: BarDatum[] = useMemo(
    () =>
      (results?.questions ?? []).map((question) => ({
        key: `q-${question.index}`,
        label: `${question.index + 1}`,
        value: question.correct_count,
        barClass: QUIZ_TILE_BAR[0],
      })),
    [results],
  );

  const errorKey = quizErrorKey(failure ?? room.errorCode);

  if (creating) {
    return (
      <div className="grid h-64 place-items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-edge border-t-teal" />
        <p className="text-sm text-muted">{t("quiz.subtitle")}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="surface p-7 text-start">
        <h1 className="font-display text-2xl font-extrabold">{t("quiz.title")}</h1>
        <p className="mt-2 text-sm text-coral">{t(errorKey ?? "quiz.noQuestions")}</p>
      </div>
    );
  }

  const status = state?.status ?? summary.status;
  const players = state?.players ?? [];

  return (
    <div className="space-y-6 text-start">
      <section className="surface animate-rise overflow-hidden p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="chip">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === "RUNNING" ? "bg-teal" : status === "ENDED" ? "bg-muted" : "bg-amber"
                }`}
              />
              {status === "ENDED" ? t("quiz.ended") : t("quiz.live")}
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold">{t("quiz.title")}</h1>
            <p className="mt-1 truncate text-muted">{summary.lesson_topic}</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {status === "LOBBY" && <QuizJoinCode pin={summary.pin} />}
            <div className="text-start">
            <span className="label">{t("quiz.pin")}</span>
            <div className="font-mono text-5xl font-extrabold tracking-[0.3em] text-teal">
              {summary.pin}
            </div>
            <p className="mt-2 text-xs text-muted">
              {t("quiz.players")}: {players.length} · {t("quiz.question")}:{" "}
              {Math.min(state?.index !== undefined && status !== "LOBBY" ? state.index + 1 : 0, summary.questions_count)}
              /{summary.questions_count}
            </p>
            </div>
          </div>
        </div>

        {errorKey && <p className="mt-4 text-sm text-coral">{t(errorKey)}</p>}

        {status !== "ENDED" && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={room.next}>
              {status === "LOBBY" ? t("quiz.start") : t("quiz.next")}
            </button>
            <button
              type="button"
              className="btn-ghost hover:border-coral/60 hover:text-coral"
              onClick={room.finish}
            >
              {t("quiz.finish")}
            </button>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {status === "LOBBY" && (
            <section className="surface p-7">
              <h2 className="font-display text-lg font-extrabold">{t("quiz.waiting")}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {players.length === 0 ? (
                  <p className="text-sm text-muted">{t("quiz.players")}: 0</p>
                ) : (
                  players.map((player) => (
                    <span key={player.id} className="chip animate-rise">
                      {player.name}
                    </span>
                  ))
                )}
              </div>
            </section>
          )}

          {status === "RUNNING" && state?.question && (
            <section className="surface p-7">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <span className="label">
                    {t("quiz.question")} {state.index + 1}/{state.total}
                  </span>
                  <h2 className="font-display text-2xl font-extrabold leading-snug">
                    <MathText text={state.question.text} />
                  </h2>
                  <p className="mt-3 text-sm text-muted">
                    {t("quiz.answered")}: {answered.answered}/{answered.total}
                  </p>
                </div>
                <QuizTimer
                  deadline={state.deadline}
                  seconds={state.question.seconds}
                  label={t("quiz.timeLeft")}
                />
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {state.question.options.map((option, index) => (
                  <div
                    key={`${index}-${option}`}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
                      QUIZ_TILE_STYLE[index]
                    } ${reveal && reveal.correct_index !== index ? "opacity-40" : ""}`}
                  >
                    <span className="font-mono text-xs">{QUIZ_TILE_GLYPH[index]}</span>
                    <MathText text={option} className="min-w-0 flex-1 truncate" />
                    {reveal?.correct_index === index && (
                      <span className="text-xs uppercase">{t("quiz.correct")}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-7">
                <span className="label">{t("quiz.answered")}</span>
                <QuizBars data={questionBars} />
              </div>
            </section>
          )}

          {status === "ENDED" && (
            <section className="surface p-7">
              <h2 className="font-display text-lg font-extrabold">{t("quiz.results")}</h2>

              {resultBars.length > 0 && (
                <div className="mt-5">
                  <span className="label">{t("quiz.correct")}</span>
                  <QuizBars data={resultBars} />
                </div>
              )}

              <ul className="mt-7 space-y-3">
                {(results?.questions ?? []).map((question) => {
                  const total = Math.max(1, question.correct_count + question.wrong_count);
                  return (
                    <li key={question.index} className="rounded-xl border border-edge p-4">
                      <div className="flex items-start justify-between gap-4">
                        <p className="min-w-0 flex-1 text-sm font-semibold text-paper">
                          {question.index + 1}. {question.text}
                        </p>
                        <span className="shrink-0 font-mono text-xs text-muted">
                          {Math.round(question.avg_ms / 100) / 10}s
                        </span>
                      </div>
                      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-edge">
                        <span
                          className="h-full bg-teal transition-[width] duration-500"
                          style={{ width: `${(question.correct_count / total) * 100}%` }}
                        />
                        <span
                          className="h-full bg-coral transition-[width] duration-500"
                          style={{ width: `${(question.wrong_count / total) * 100}%` }}
                        />
                      </div>
                      <div className="mt-2 flex gap-4 text-[11px] text-muted">
                        <span>
                          {t("quiz.correct")}: {question.correct_count}
                        </span>
                        <span>
                          {t("quiz.wrong")}: {question.wrong_count}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="surface h-fit p-6">
          <h2 className="mb-4 font-display text-sm font-extrabold uppercase tracking-wide text-muted">
            {t("quiz.leaderboard")}
          </h2>
          <QuizLeaderboard
            rows={
              status === "ENDED"
                ? (results?.leaderboard ?? []).map((row) => ({
                    id: row.student_id,
                    name: row.name,
                    score: row.score,
                    detail: `${row.correct}/${row.total}`,
                  }))
                : room.leaderboard.map((player) => ({
                    id: player.id,
                    name: player.name,
                    score: player.score,
                    detail: `${player.correct} ${t("quiz.correct")}`,
                  }))
            }
          />
        </aside>
      </div>
    </div>
  );
}
