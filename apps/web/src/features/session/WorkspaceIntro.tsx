import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";

const STEPS: TranslationKey[] = [
  "session.panel.step.talk",
  "session.panel.step.drill",
  "session.panel.step.check",
];

export function WorkspaceIntro({ connected }: { connected: boolean }) {
  const { t } = useI18n();

  return (
    <div className="surface relative overflow-hidden p-7">
      <span className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-teal/20 to-azure/10 blur-3xl" />

      <div className="relative">
        <h3 className="text-start font-display text-lg font-extrabold">
          {t(connected ? "session.panel.empty.title" : "session.panel.start.title")}
        </h3>
        <p className="mt-1.5 max-w-md text-start text-sm leading-relaxed text-muted">
          {t(connected ? "session.panel.empty" : "session.panel.start")}
        </p>

        <ol className="mt-5 space-y-2.5">
          {STEPS.map((key, index) => (
            <li key={key} className="flex items-center gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-teal/40 bg-teal/10 font-mono text-[10px] font-bold text-teal">
                {index + 1}
              </span>
              <span className="text-start text-sm text-paper/85">{t(key)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative mt-6 rounded-2xl border border-dashed border-edge p-4 opacity-60">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal/60" />
          <div className="skeleton h-3 w-32" />
        </div>
        <div className="mt-3 space-y-2.5">
          {["68%", "84%"].map((width) => (
            <div key={width} className="flex items-start gap-3">
              <span className="mt-0.5 h-6 w-6 shrink-0 rounded-lg border border-edge" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-2.5" style={{ width }} />
                <div className="h-8 w-full rounded-xl border border-edge/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
