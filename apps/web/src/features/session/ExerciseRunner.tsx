import { useState } from "react";
import { MathText } from "../../components/MathText";
import { NavIcon } from "../../components/NavIcon";
import { StatRing } from "../../components/StatRing";
import { useI18n } from "../../i18n/i18n";
import { EXERCISE_PASS_PERCENT } from "./session.const";
import type { ExerciseResult } from "./session.types";
import type { ExercisePayload } from "../../lib/types";

interface ExerciseRunnerProps {
  callId: string;
  payload: ExercisePayload;
  result: ExerciseResult | null;
  busy: boolean;
  onSubmit: (callId: string, answers: string[]) => void;
}

export function ExerciseRunner({ callId, payload, result, busy, onSubmit }: ExerciseRunnerProps) {
  const { t } = useI18n();
  const items = payload.items ?? [];
  const [answers, setAnswers] = useState<string[]>(() => items.map(() => ""));
  const [sent, setSent] = useState(false);

  const submit = () => {
    setSent(true);
    onSubmit(callId, answers);
  };

  const waiting = sent && !result;
  const verdictOf = (index: number) => result?.items.find((item) => item.index === index) ?? null;

  const tone = (index: number) => {
    const verdict = verdictOf(index);
    if (!verdict) return "border-edge/70";
    return verdict.correct ? "border-teal/60 bg-teal/5" : "border-coral/60 bg-coral/5";
  };

  return (
    <article className="surface animate-rise relative overflow-hidden p-5 sm:p-6">
      <span className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-gradient-to-br from-teal/20 to-azure/15 blur-3xl" />

      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="chip border-teal/40 text-teal">
            <NavIcon name="spark" className="h-3.5 w-3.5" />
            {t("card.EXERCISE")}
          </span>
          <h3 className="mt-2 text-start font-display text-lg font-extrabold">{payload.title}</h3>
          <p className="mt-1 text-start text-sm text-muted">{payload.instruction}</p>
        </div>

        {result && <StatRing percent={result.percent} label={t("exercise.score")} />}
      </header>

      <ol className="relative mt-5 space-y-3">
        {items.map((item, index) => {
          const verdict = verdictOf(index);
          return (
            <li key={index} className={`rounded-2xl border px-4 py-3 transition ${tone(index)}`}>
              <div className="flex gap-3">
                <span className="font-mono text-xs text-azure">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <MathText text={item.prompt} className="block text-start text-sm" />

                  <input
                    className="field mt-2.5 py-2 text-sm"
                    placeholder={t("exercise.answer")}
                    value={answers[index] ?? ""}
                    disabled={Boolean(result) || waiting}
                    onChange={(event) =>
                      setAnswers((prev) =>
                        prev.map((value, position) =>
                          position === index ? event.target.value : value,
                        ),
                      )
                    }
                    onKeyDown={(event) => event.key === "Enter" && !result && !waiting && submit()}
                  />

                  {!result && item.hint && (
                    <p className="mt-1.5 text-start text-xs text-muted">
                      {t("card.hint")}: {item.hint}
                    </p>
                  )}

                  {verdict && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`chip ${verdict.correct ? "border-teal/50 text-teal" : "border-coral/50 text-coral"}`}
                      >
                        <NavIcon name={verdict.correct ? "check" : "close"} className="h-3.5 w-3.5" />
                        {t(verdict.correct ? "exercise.correct" : "exercise.wrong")}
                      </span>
                      {!verdict.correct && (
                        <span className="rounded bg-teal/15 px-2 py-0.5 text-teal">
                          {verdict.expected}
                        </span>
                      )}
                      {verdict.comment && (
                        <span className="text-start text-muted">{verdict.comment}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="relative mt-5 flex flex-wrap items-center gap-3">
        {!result && (
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={waiting || busy || answers.every((answer) => !answer.trim())}
          >
            {waiting ? t("exercise.checking") : t("exercise.check")}
          </button>
        )}

        {result && (
          <>
            <span className="chip">
              {result.correct}/{result.total} {t("exercise.correctCount")}
            </span>
            <span
              className={`text-start text-sm ${result.percent < EXERCISE_PASS_PERCENT ? "text-coral" : "text-teal"}`}
            >
              {t(result.percent < EXERCISE_PASS_PERCENT ? "exercise.weak" : "exercise.strong")}
            </span>
          </>
        )}
      </footer>
    </article>
  );
}
