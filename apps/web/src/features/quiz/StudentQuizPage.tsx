import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import { MathText } from "../../components/MathText";
import { QuizLeaderboard } from "./QuizLeaderboard";
import { QuizTimer } from "./QuizTimer";
import { useQuizRoom } from "./useQuizRoom";
import { quizErrorKey } from "./quiz.errors";
import { QUIZ_PIN_LENGTH, QUIZ_TILE_GLYPH, QUIZ_TILE_STYLE } from "./quiz.const";
import type { QuizSummary } from "./quiz.types";

export function StudentQuizPage() {
  const { token, user, refresh } = useAuth();
  const { t } = useI18n();

  const [params] = useSearchParams();
  const scannedPin = (params.get("pin") ?? "").replace(/\D/g, "").slice(0, QUIZ_PIN_LENGTH);

  const [pinInput, setPinInput] = useState(scannedPin);
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const scanned = useRef(false);

  const room = useQuizRoom(confirmed && summary ? summary.pin : null);
  const { state, reveal, outcome, chosen, results } = room;

  const myRank = useMemo(() => {
    const rows = results?.leaderboard ?? [];
    const index = rows.findIndex((row) => row.student_id === user?.id);
    return index < 0 ? null : { rank: index + 1, row: rows[index] };
  }, [results, user?.id]);

  const lookup = async (pin: string) => {
    if (pin.length !== QUIZ_PIN_LENGTH) return;
    setJoining(true);
    setJoinError(null);
    try {
      setSummary(await api.get<QuizSummary>(`/quiz/sessions/by-pin/${pin}`, token));
    } catch (error) {
      setJoinError(error instanceof ApiError ? error.code : "unknown");
    } finally {
      setJoining(false);
    }
  };

  const submitPin = (event: FormEvent) => {
    event.preventDefault();
    void lookup(pinInput.replace(/\D/g, "").slice(0, QUIZ_PIN_LENGTH));
  };

  useEffect(() => {
    if (scanned.current || scannedPin.length !== QUIZ_PIN_LENGTH || !token) return;
    scanned.current = true;
    void lookup(scannedPin);
  }, [scannedPin, token]);

  const enter = async () => {
    if (!summary) return;
    if (summary.is_member) {
      setConfirmed(true);
      return;
    }

    setJoining(true);
    setJoinError(null);
    try {
      setSummary(await api.post<QuizSummary>("/quiz/sessions/join", { pin: summary.pin }, token));
      await refresh();
      setConfirmed(true);
    } catch (error) {
      setJoinError(error instanceof ApiError ? error.code : "unknown");
    } finally {
      setJoining(false);
    }
  };

  const errorKey = quizErrorKey(joinError ?? room.errorCode);

  if (summary && !confirmed) {
    return (
      <div className="mx-auto max-w-md text-start">
        <section className="surface animate-rise p-7">
          <span className="chip border-teal/40 text-teal">{t("quiz.session")}</span>
          <h1 className="mt-3 font-display text-2xl font-extrabold">{summary.lesson_topic}</h1>

          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t("group.title")}</dt>
              <dd className="font-semibold">
                {summary.group_name} · {summary.subject}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t("quiz.teacher")}</dt>
              <dd className="font-semibold">{summary.teacher_name}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t("quiz.pin")}</dt>
              <dd className="font-mono text-lg font-extrabold tracking-[0.2em] text-teal">
                {summary.pin}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t("quiz.questions")}</dt>
              <dd className="font-semibold">
                {summary.generation === "PENDING" ? "…" : summary.questions_count}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t("quiz.live")}</dt>
              <dd className="font-semibold">
                {summary.status === "ENDED" ? t("quiz.ended") : t("quiz.waiting")}
              </dd>
            </div>
          </dl>

          {!summary.is_member && (
            <div className="mt-5 space-y-2 rounded-2xl border border-teal/40 bg-teal/10 px-4 py-3 text-start text-sm text-teal">
              <p>{t("group.join.notice")}</p>
              {summary.school && summary.school !== user?.institution_name && (
                <p className="text-amber">
                  {t("group.join.transfer")}: {summary.school}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn-primary mt-6 w-full"
            disabled={summary.status === "ENDED" || joining}
            onClick={() => void enter()}
          >
            {summary.is_member ? t("quiz.join") : t("group.join.action")}
          </button>

          {errorKey && <p className="mt-3 text-sm text-coral">{t(errorKey)}</p>}
        </section>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-md text-start">
        <section className="surface animate-rise p-7">
          <h1 className="font-display text-2xl font-extrabold">{t("quiz.title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("quiz.subtitle")}</p>

          <form className="mt-6 space-y-4" onSubmit={submitPin}>
            <div>
              <span className="label">{t("quiz.pin")}</span>
              <input
                className="field text-center font-mono text-3xl font-extrabold tracking-[0.4em]"
                inputMode="numeric"
                autoComplete="off"
                placeholder={t("quiz.enterPin")}
                maxLength={QUIZ_PIN_LENGTH}
                value={pinInput}
                onChange={(event) =>
                  setPinInput(event.target.value.replace(/\D/g, "").slice(0, QUIZ_PIN_LENGTH))
                }
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={joining || pinInput.length !== QUIZ_PIN_LENGTH}
            >
              {t("quiz.join")}
            </button>

            {errorKey && <p className="text-sm text-coral">{t(errorKey)}</p>}
          </form>
        </section>
      </div>
    );
  }

  const status = state?.status ?? summary.status;

  if (status === "ENDED") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-start">
        <section className="surface animate-rise p-7">
          <span className="chip">{t("quiz.ended")}</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold">{t("quiz.results")}</h1>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-edge bg-panel/50 p-4">
              <span className="label">{t("quiz.rank")}</span>
              <div className="font-display text-3xl font-extrabold text-teal">
                {myRank ? myRank.rank : "-"}
              </div>
            </div>
            <div className="rounded-xl border border-edge bg-panel/50 p-4">
              <span className="label">{t("quiz.score")}</span>
              <div className="font-display text-3xl font-extrabold">{myRank?.row.score ?? 0}</div>
            </div>
            <div className="rounded-xl border border-edge bg-panel/50 p-4">
              <span className="label">{t("quiz.accuracy")}</span>
              <div className="font-display text-3xl font-extrabold">
                {myRank?.row.total
                  ? Math.round((myRank.row.correct / myRank.row.total) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>

          {myRank && (
            <p className="mt-4 text-sm text-muted">
              {t("quiz.speed")}: {Math.round(myRank.row.avg_ms / 100) / 10}s ·{" "}
              {t("quiz.correct")}: {myRank.row.correct}/{myRank.row.total}
            </p>
          )}
        </section>

        <section className="surface p-6">
          <h2 className="mb-4 font-display text-sm font-extrabold uppercase tracking-wide text-muted">
            {t("quiz.leaderboard")}
          </h2>
          <QuizLeaderboard
            rows={(results?.leaderboard ?? []).map((row) => ({
              id: row.student_id,
              name: row.name,
              score: row.score,
              detail: `${row.correct}/${row.total}`,
            }))}
            meId={user?.id}
          />
        </section>
      </div>
    );
  }

  if (status !== "RUNNING" || !state?.question) {
    return (
      <div className="mx-auto max-w-md text-start">
        <section className="surface animate-rise grid place-items-center gap-4 p-10">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-teal" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-teal" />
          </span>
          <h1 className="font-display text-2xl font-extrabold">{t("quiz.waiting")}</h1>
          <p className="text-sm text-muted">{summary.lesson_topic}</p>
          <span className="chip">
            {t("quiz.players")}: {state?.players.length ?? 0}
          </span>
          {errorKey && <p className="text-sm text-coral">{t(errorKey)}</p>}
        </section>
      </div>
    );
  }

  const locked = chosen !== null || Boolean(reveal);

  return (
    <div className="mx-auto max-w-3xl space-y-5 text-start">
      <section className="surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <span className="label">
              {t("quiz.question")} {state.index + 1}/{state.total}
            </span>
            <h1 className="font-display text-2xl font-extrabold leading-snug">
              <MathText text={state.question.text} />
            </h1>
          </div>
          <QuizTimer
            deadline={state.deadline}
            seconds={state.question.seconds}
            label={t("quiz.timeLeft")}
          />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {state.question.options.map((option, index) => {
          const isChosen = chosen === index;
          const isCorrect = reveal?.correct_index === index || outcome?.correct_index === index;
          const dim = locked && !isChosen && !isCorrect;

          return (
            <button
              key={`${index}-${option}`}
              type="button"
              disabled={locked}
              onClick={() => room.answer(index)}
              className={`flex min-h-24 items-center gap-4 rounded-2xl border p-5 text-start font-display text-lg font-bold transition ${
                QUIZ_TILE_STYLE[index]
              } ${dim ? "opacity-35" : ""} ${isChosen ? "ring-2 ring-paper/60" : ""} ${
                isCorrect ? "ring-2 ring-teal" : ""
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-current font-mono text-sm">
                {QUIZ_TILE_GLYPH[index]}
              </span>
              <MathText text={option} className="min-w-0 flex-1" />
            </button>
          );
        })}
      </div>

      {outcome && (
        <section
          className={`surface animate-rise flex items-center justify-between gap-4 p-5 ${
            outcome.correct ? "border-teal/60" : "border-coral/60"
          }`}
        >
          <span
            className={`font-display text-xl font-extrabold ${
              outcome.correct ? "text-teal" : "text-coral"
            }`}
          >
            {outcome.correct ? t("quiz.correct") : t("quiz.wrong")}
          </span>
          <span className="font-mono text-lg font-bold text-paper">
            +{outcome.score} <span className="text-xs text-muted">{t("quiz.score")}</span>
          </span>
        </section>
      )}

      <section className="surface p-5">
        <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-muted">
          {t("quiz.leaderboard")}
        </h2>
        <QuizLeaderboard
          rows={room.leaderboard.map((player) => ({
            id: player.id,
            name: player.name,
            score: player.score,
          }))}
          meId={user?.id}
          limit={5}
        />
      </section>
    </div>
  );
}
