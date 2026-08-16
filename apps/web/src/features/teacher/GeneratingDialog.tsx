import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavIcon } from "../../components/NavIcon";
import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";

const STEPS: TranslationKey[] = [
  "teacher.generating.step1",
  "teacher.generating.step2",
  "teacher.generating.step3",
  "teacher.generating.step4",
];

const STEP_MS = 2600;

export function GeneratingDialog({ topic }: { topic: string }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setStep((prev) => Math.min(prev + 1, STEPS.length - 1)),
      STEP_MS,
    );
    return () => clearInterval(timer);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-5 backdrop-blur-md">
      <div className="surface relative w-full max-w-[440px] animate-rise overflow-hidden p-8 text-start">
        <span className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-teal/25 via-transparent to-azure/25 opacity-80" />

        <div className="relative grid place-items-center">
          <span className="absolute h-28 w-28 rounded-full bg-gradient-to-br from-teal/30 to-azure/30 blur-2xl" />
          <span className="relative grid h-24 w-24 place-items-center rounded-full">
            <span className="ai-ring absolute inset-0 animate-spin rounded-full" />
            <span className="absolute inset-[3px] rounded-full bg-panel" />
            <span className="relative animate-pulse text-teal">
              <NavIcon name="spark" className="h-9 w-9" />
            </span>
          </span>
        </div>

        <h3 className="relative mt-6 text-center font-display text-lg font-extrabold">
          {t("teacher.generating")}
        </h3>
        <p className="relative mt-1 truncate text-center text-xs text-muted">{topic}</p>

        <ol className="relative mt-6 space-y-2.5">
          {STEPS.map((key, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <li
                key={key}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                  active
                    ? "border-teal/45 bg-teal/10 text-paper"
                    : done
                      ? "border-edge/70 text-muted"
                      : "border-transparent text-muted/60"
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${
                    done
                      ? "border-teal/50 bg-teal/20 text-teal"
                      : active
                        ? "border-teal/60 text-teal"
                        : "border-edge text-muted"
                  }`}
                >
                  {done ? "✓" : index + 1}
                </span>
                <span className="flex-1">{t(key)}</span>
                {active && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />}
              </li>
            );
          })}
        </ol>

        <div className="relative mt-6 h-1 overflow-hidden rounded-full bg-edge">
          <span className="ai-progress block h-full w-1/3 rounded-full bg-gradient-to-r from-teal to-azure" />
        </div>
        <p className="relative mt-3 text-center text-xs text-muted">{t("teacher.generating.hint")}</p>
      </div>
    </div>,
    document.body,
  );
}
