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
          <p className="mt-1 text-start text-sm text-muted">{t("build.wait")}</p>
        </div>
      </div>

      <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-edge">
        <span className="block h-full w-1/3 animate-buildBar rounded-full bg-gradient-to-r from-teal via-azure to-teal" />
      </div>

      <div className="relative mt-4 space-y-2">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </article>
  );
}
