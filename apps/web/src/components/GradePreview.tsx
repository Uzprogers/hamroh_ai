import { useEffect, useState } from "react";
import { useI18n } from "../i18n/i18n";

export function GradePreview() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const reveal = (index: number) =>
    `transition-all duration-500 ease-out ${
      step >= index ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
    }`;

  return (
    <div className="surface p-6">
      <div className="flex items-center justify-between gap-3 border-b border-edge/70 pb-4">
        <div className="min-w-0">
          <div className="font-display text-sm font-bold">{t("preview.subject")}</div>
          <div className="mt-0.5 truncate text-xs text-muted">{t("preview.topic")}</div>
        </div>
        <span className="chip shrink-0 border-teal/40 text-teal">{t("preview.badge")}</span>
      </div>

      <p className="mt-4 text-xs text-muted">{t("preview.task")}</p>

      <div className={`mt-4 flex justify-end ${reveal(1)}`}>
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-edge bg-panel/80 px-4 py-3">
          <p className="text-[11px] font-semibold text-muted">{t("preview.student")}</p>
          <p className="mt-1 text-sm leading-relaxed">
            Yesterday I <span className="text-coral line-through decoration-coral/60">go</span> to my
            grandmother's house.
          </p>
        </div>
      </div>

      <div className={`mt-3 flex gap-3 ${reveal(2)}`}>
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal to-azure text-xs font-extrabold text-ink">
          H
        </span>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-teal/35 bg-teal/10 px-4 py-3">
          <p className="text-sm leading-relaxed">{t("preview.correction")}</p>
        </div>
      </div>

      <div className={`mt-5 flex items-center justify-between gap-4 border-t border-edge/70 pt-4 ${reveal(3)}`}>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {t("preview.scoreLabel")}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-2xl font-extrabold brand-text">8.5</span>
            <span className="text-sm text-muted">/ 10</span>
          </div>
        </div>
        <div className="text-end">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {t("preview.timeLabel")}
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold">3.2s</div>
        </div>
      </div>
    </div>
  );
}
