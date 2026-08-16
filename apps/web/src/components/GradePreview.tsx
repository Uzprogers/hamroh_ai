import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { PREVIEW_SCENARIOS } from "./gradePreview.scenarios";

const ROTATE_MS = 7600;
const SWAP_MS = 260;
const STEPS_MS = [260, 820, 1380];
const RING_RADIUS = 26;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function marked(text: string): ReactNode[] {
  return text.split(/(\[\[[^\]]*\]\])/).map((part, index) =>
    part.startsWith("[[") && part.endsWith("]]") ? (
      <span key={index} className="text-coral line-through decoration-coral/60">
        {part.slice(2, -2)}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function ScoreRing({ score, revealed }: { score: number; revealed: boolean }) {
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="previewRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--teal))" />
            <stop offset="100%" stopColor="rgb(var(--azure))" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r={RING_RADIUS} fill="none" stroke="rgb(var(--edge))" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={RING_RADIUS}
          fill="none"
          stroke="url(#previewRing)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={revealed ? RING_LENGTH * (1 - score / 10) : RING_LENGTH}
          className="transition-[stroke-dashoffset] duration-[900ms] ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-lg font-extrabold">{score.toFixed(1)}</span>
      </div>
    </div>
  );
}

export function GradePreview() {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const timers = STEPS_MS.map((ms, position) => setTimeout(() => setStep(position + 1), ms));
    const rotate = setTimeout(
      () => setPending((index + 1) % PREVIEW_SCENARIOS.length),
      ROTATE_MS,
    );
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(rotate);
    };
  }, [index]);

  useEffect(() => {
    if (pending === null) return;
    const timer = setTimeout(() => {
      setIndex(pending);
      setPending(null);
    }, SWAP_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  const scenario = PREVIEW_SCENARIOS[index];
  const swapping = pending !== null;
  const reveal = (at: number) =>
    `transition-all duration-500 ease-out ${
      step >= at ? "translate-y-0 opacity-100 blur-0" : "translate-y-2 opacity-0 blur-[2px]"
    }`;

  return (
    <div className="surface flex h-full w-full flex-col overflow-hidden p-5 sm:p-6">
      <span
        key={scenario.id}
        className="card-sweep pointer-events-none absolute inset-0 animate-cardSweep"
      />

      <div
        className={`relative flex min-h-[352px] flex-1 flex-col transition-all duration-200 ease-out ${
          swapping ? "translate-y-1 opacity-0 blur-[2px]" : "translate-y-0 opacity-100 blur-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-edge/70 pb-4">
          <div className="min-w-0">
            <span className="rounded-md bg-teal/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">
              {t(scenario.levelKey)}
            </span>
            <div className="mt-2 font-display text-base font-bold">{t(scenario.subjectKey)}</div>
            <div className="mt-0.5 truncate text-xs text-muted">{t(scenario.topicKey)}</div>
          </div>
          <span className="chip shrink-0 border-teal/40 text-teal">{t("preview.badge")}</span>
        </div>

        <p className="mt-4 text-xs text-muted">{t(scenario.taskKey)}</p>

        <div className="flex-1">
          <div className={`mt-4 flex justify-end ${reveal(1)}`}>
            <div className="max-w-[88%] rounded-2xl rounded-br-md border border-edge bg-panel/80 px-4 py-3">
              <p className="text-[11px] font-semibold text-muted">{t("preview.student")}</p>
              <p
                className={`mt-1 text-sm leading-relaxed ${scenario.monospace ? "font-mono text-[13px]" : ""}`}
              >
                {marked(t(scenario.answerKey))}
              </p>
            </div>
          </div>

          <div className={`mt-3 flex gap-3 ${reveal(2)}`}>
            <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal to-azure text-xs font-extrabold text-ink">
              H
            </span>
            <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-teal/35 bg-teal/10 px-4 py-3">
              <p className="text-sm leading-relaxed">{t(scenario.feedbackKey)}</p>
            </div>
          </div>
        </div>

        <div className={`mt-5 flex items-center gap-4 border-t border-edge/70 pt-4 ${reveal(3)}`}>
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <ScoreRing score={scenario.score} revealed={step >= 3} />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              {t("preview.scoreLabel")}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {t("preview.metrics")}
              </span>
              <span className="font-mono text-[11px] text-muted">
                {t("preview.timeLabel")} {scenario.seconds.toFixed(1)}s
              </span>
            </div>

            <div className="mt-2.5 space-y-2">
              {scenario.metrics.map((metric, position) => (
                <div key={metric.labelKey} className="flex items-center gap-2.5">
                  <span className="w-[92px] shrink-0 truncate text-[11px] text-muted">
                    {t(metric.labelKey)}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-teal to-azure transition-[width] duration-700 ease-out"
                      style={{
                        width: step >= 3 ? `${metric.value * 10}%` : "0%",
                        transitionDelay: `${position * 110}ms`,
                      }}
                    />
                  </span>
                  <span className="w-4 shrink-0 text-end font-mono text-[11px]">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-1.5 border-t border-edge/70 pt-4">
        {PREVIEW_SCENARIOS.map((item, position) => (
          <button
            key={item.id}
            type="button"
            onClick={() => position !== index && setPending(position)}
            className={`relative overflow-hidden rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              position === index
                ? "border-teal/50 text-paper"
                : "border-edge text-muted hover:border-teal/40 hover:text-paper"
            }`}
          >
            {position === index && (
              <span
                key={scenario.id}
                className="absolute inset-x-0 bottom-0 h-[2px] origin-left animate-previewSweep bg-gradient-to-r from-teal to-azure"
              />
            )}
            <span className="relative">{t(item.tabKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
