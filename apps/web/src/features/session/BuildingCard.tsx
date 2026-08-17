import { useEffect, useState } from "react";
import { BUILD_ROWS, BUILD_STAGES, BUILD_STAGE_MS } from "./session.const";
import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";

const TOOL_LABEL: Record<string, TranslationKey> = {
  create_exercise: "build.exercise",
  explain_topic: "build.recap",
  get_results: "build.results",
  get_mistakes: "build.mistakes",
  review_speaking: "build.speaking",
  study_plan: "build.plan",
};

export function BuildingCard({ tool }: { tool: string }) {
  const { t } = useI18n();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setStage((current) => Math.min(current + 1, BUILD_STAGES.length - 1)),
      BUILD_STAGE_MS,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <article className="surface animate-rise relative overflow-hidden p-6">
      <span className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-azure/30 to-teal/20 blur-3xl" />

      <div className="relative flex items-center gap-5">
        <span className="relative grid h-16 w-16 shrink-0 place-items-center">
          <span className="absolute h-16 w-16 animate-pulseRing rounded-full border border-azure/50" />
          <span className="absolute h-2 w-2 animate-orbit rounded-full bg-teal" />
          <span
            className="absolute h-1.5 w-1.5 animate-orbit rounded-full bg-azure"
            style={{ animationDelay: "-1.1s" }}
          />
          <span
            className="absolute h-1.5 w-1.5 animate-orbit rounded-full bg-amber"
            style={{ animationDelay: "-2.2s" }}
          />
          <span className="h-6 w-6 rounded-full bg-gradient-to-br from-teal to-azure shadow-glow" />
        </span>

        <div className="min-w-0">
          <div className="text-start font-display text-base font-extrabold">
            {t(TOOL_LABEL[tool] ?? "build.generic")}
          </div>
          <p key={stage} className="mt-1 animate-rise text-start text-sm text-teal">
            {t(BUILD_STAGES[stage])}
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex gap-1.5">
        {BUILD_STAGES.map((key, index) => (
          <span
            key={key}
            className={`h-1 flex-1 overflow-hidden rounded-full transition-colors duration-500 ${
              index <= stage ? "bg-gradient-to-r from-teal to-azure" : "bg-edge"
            }`}
          >
            {index === stage && (
              <span className="block h-full w-1/2 animate-buildBar rounded-full bg-paper/40" />
            )}
          </span>
        ))}
      </div>

      <div className="relative mt-5 space-y-3">
        {BUILD_ROWS.map((width, index) => (
          <div
            key={width}
            className="flex animate-rise items-start gap-3"
            style={{ animationDelay: `${index * 160}ms`, animationFillMode: "backwards" }}
          >
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-edge bg-panel/60 font-mono text-[10px] text-muted">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-3" style={{ width }} />
              <div className="skeleton h-9 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
