import { MathText } from "../../components/MathText";
import { NavIcon } from "../../components/NavIcon";
import { StatRing } from "../../components/StatRing";
import { useI18n } from "../../i18n/i18n";
import { QUIZ_TILE_GLYPH } from "./quiz.const";
import { accuracyOf, playedOn, secondsOf } from "./quiz.format";
import type { QuizAnswerReview, QuizReport } from "./quiz.types";

function Tile({ value, label, tone = "" }: { value: string; label: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-edge bg-panel/50 p-4">
      <span className="block text-start text-[10px] uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className={`mt-1 block text-start font-display text-2xl font-extrabold ${tone}`}>
        {value}
      </span>
    </div>
  );
}

function AnswerCard({ answer }: { answer: QuizAnswerReview }) {
  const { t } = useI18n();

  const state = answer.chosen_index === null ? "skipped" : answer.correct ? "correct" : "wrong";
  const badge = {
    correct: "border-teal/50 text-teal",
    wrong: "border-coral/50 text-coral",
    skipped: "",
  }[state];

  const tone = (index: number) => {
    if (index === answer.correct_index) return "border-teal/60 bg-teal/10 text-teal";
    if (index === answer.chosen_index) return "border-coral/60 bg-coral/10 text-coral";
    return "border-edge bg-panel/40 text-muted";
  };

  return (
    <article className="rounded-2xl border border-edge/70 bg-panel/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="font-mono text-sm text-teal">
            {String(answer.index + 1).padStart(2, "0")}
          </span>
          <h3 className="min-w-0 text-start font-display text-lg font-bold leading-snug">
            <MathText text={answer.text} />
          </h3>
        </div>
        <span className={`chip shrink-0 ${badge}`}>
          {t(
            state === "correct" ? "quiz.correct" : state === "wrong" ? "quiz.wrong" : "quiz.skipped",
          )}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {answer.options.map((option, index) => (
          <div
            key={`${index}-${option}`}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-start text-sm ${tone(index)}`}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-current font-mono text-xs">
              {QUIZ_TILE_GLYPH[index]}
            </span>
            <MathText text={option} className="min-w-0 flex-1" />
            {index === answer.correct_index && <NavIcon name="check" className="h-4 w-4 shrink-0" />}
            {index === answer.chosen_index && index !== answer.correct_index && (
              <NavIcon name="close" className="h-4 w-4 shrink-0" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="chip">
          {t("quiz.spent")}: {secondsOf(answer.elapsed_ms)}
        </span>
        <span className="chip">
          {answer.score} {t("quiz.score")}
        </span>
        <span className="ms-auto flex min-w-[140px] items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-teal to-azure"
              style={{ width: `${answer.class_correct_percent}%` }}
            />
          </span>
          <span className="shrink-0 font-mono text-xs text-muted">
            {answer.class_correct_percent}%
          </span>
        </span>
      </div>
      <p className="mt-1.5 text-end text-[11px] text-muted">{t("quiz.classCorrect")}</p>
    </article>
  );
}

export function QuizReportView({ report }: { report: QuizReport }) {
  const { t } = useI18n();
  const { attempt, answers } = report;

  return (
    <div className="space-y-5">
      <section className="surface animate-rise relative overflow-hidden p-6 sm:p-7">
        <span className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-teal/25 to-azure/20 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border-teal/40 text-teal">{t("quiz.report")}</span>
              <span className="chip font-mono">{attempt.pin}</span>
              <span className="text-xs text-muted">{playedOn(attempt.played_at)}</span>
            </div>
            <h1 className="mt-3 text-start font-display text-2xl font-extrabold sm:text-3xl">
              {attempt.lesson_topic}
            </h1>
            <p className="mt-1.5 text-start text-sm text-muted">
              {[attempt.group_name, attempt.subject].filter(Boolean).join(" · ")}
            </p>
          </div>

          <StatRing percent={accuracyOf(attempt)} label={t("quiz.accuracy")} />
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-4">
          <Tile
            value={attempt.rank > 0 ? `${attempt.rank}/${attempt.players}` : "—"}
            label={t("quiz.rank")}
            tone={attempt.rank === 1 ? "text-amber" : ""}
          />
          <Tile value={String(attempt.score)} label={t("quiz.score")} tone="text-teal" />
          <Tile value={`${attempt.correct}/${attempt.total}`} label={t("quiz.correct")} />
          <Tile value={secondsOf(attempt.avg_ms)} label={t("quiz.speed")} />
        </div>
      </section>

      <section className="surface p-5 sm:p-6">
        <h2 className="text-start font-display text-sm font-extrabold uppercase tracking-wide text-muted">
          {t("quiz.myAnswers")}
        </h2>
        <div className="mt-4 space-y-3">
          {answers.map((answer) => (
            <AnswerCard key={answer.index} answer={answer} />
          ))}
        </div>
      </section>
    </div>
  );
}
