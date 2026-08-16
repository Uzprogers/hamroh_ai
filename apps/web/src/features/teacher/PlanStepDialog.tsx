import { useState } from "react";
import { Modal } from "../../components/Modal";
import { useI18n } from "../../i18n/i18n";
import type { PlanStep } from "../../lib/types";

export function PlanStepDialog({
  plan,
  index,
  onClose,
}: {
  plan: PlanStep[];
  index: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(index);
  const step = plan[current];

  if (!step) return null;

  return (
    <Modal
      size="full"
      icon="lessons"
      title={t("lesson.plan.detail")}
      subtitle={`${t("lesson.step")} ${current + 1} / ${plan.length}`}
      onClose={onClose}
    >
      <div className="grid gap-5 lg:grid-cols-[260px_1fr] lg:items-start">
        <ol className="space-y-1.5">
          {plan.map((item, position) => (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => setCurrent(position)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition ${
                  position === current
                    ? "border-teal/60 bg-gradient-to-r from-teal/20 to-azure/10"
                    : "border-edge/70 bg-panel/50 hover:border-teal/40"
                }`}
              >
                <span
                  className={`font-mono text-xs ${position === current ? "text-teal" : "text-muted"}`}
                >
                  {String(position + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</span>
                <span className="shrink-0 text-[11px] text-muted">
                  {item.minutes} {t("card.minutes")}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="min-w-0 rounded-2xl border border-edge/70 bg-panel/40 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-teal/40 text-teal">
              {t("lesson.step")} {current + 1}
            </span>
            <span className="chip">
              {step.minutes} {t("card.minutes")}
            </span>
          </div>

          <h4 className="mt-4 font-display text-xl font-extrabold">{step.title}</h4>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
            {step.description}
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="btn-ghost px-4"
              disabled={current === 0}
              onClick={() => setCurrent((prev) => Math.max(0, prev - 1))}
            >
              {t("lesson.prev")}
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={current === plan.length - 1}
              onClick={() => setCurrent((prev) => Math.min(plan.length - 1, prev + 1))}
            >
              {t("lesson.next")}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
