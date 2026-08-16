import { MetricBar } from "./MetricBar";
import { NavIcon } from "../../components/NavIcon";
import { useI18n } from "../../i18n/i18n";
import type { GroupMistakeTally } from "./group.types";

export function MistakeTallyList({
  mistakes,
  total,
  onOpen,
}: {
  mistakes: GroupMistakeTally[];
  total: number;
  onOpen: (mistake: GroupMistakeTally) => void;
}) {
  const { t } = useI18n();

  if (mistakes.length === 0) {
    return <p className="text-start text-sm text-muted">{t("group.empty")}</p>;
  }

  const peak = mistakes[0].count;

  return (
    <>
      <p className="text-start text-xs leading-relaxed text-muted">{t("group.mistakes.hint")}</p>

      <ul className="mt-3 space-y-2.5">
        {mistakes.map((mistake, index) => {
          const share = total > 0 ? Math.round((mistake.count / total) * 100) : 0;

          return (
            <li key={mistake.label}>
              <button
                type="button"
                onClick={() => onOpen(mistake)}
                className="group w-full rounded-2xl border border-edge/70 bg-ink/25 p-3.5 text-start transition duration-300 hover:-translate-y-0.5 hover:border-coral/60 hover:bg-coral/5 focus:outline-none focus-visible:border-coral/70"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-coral/40 bg-coral/10 font-mono text-sm font-bold text-coral">
                    {mistake.count}
                  </span>
                  <div className="min-w-0 flex-1">
                    <MetricBar
                      label={mistake.label}
                      value={`${share}%`}
                      percent={peak > 0 ? (mistake.count / peak) * 100 : 0}
                      tone="warm"
                      delayMs={index * 60}
                    />
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-start text-muted">
                    {share}% {t("group.share")} · {mistake.count} {t("group.mistakes")}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-coral">
                    {t("group.detail")}
                    <NavIcon
                      name="chevron"
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
