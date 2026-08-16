import { Modal } from "../../components/Modal";
import { useI18n } from "../../i18n/i18n";
import { MistakeCard } from "./MistakeCard";
import { ShareRing } from "./ShareRing";
import type { GroupMistakeTally } from "./group.types";

export function MistakeDetailDialog({
  mistake,
  total,
  onClose,
}: {
  mistake: GroupMistakeTally;
  total: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const items = mistake.items ?? [];
  const share = total > 0 ? (mistake.count / total) * 100 : 0;

  return (
    <Modal icon="spark" title={mistake.label} subtitle={t("group.mistakes.top")} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <ShareRing percent={share} label={t("group.mistakes")} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="text-start font-display text-2xl font-extrabold text-coral">
              {mistake.count}
            </div>
            <div className="text-start text-xs text-muted">
              {t("group.mistakes")} · {total} {t("group.submissions")}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-start text-sm text-muted">{t("group.empty")}</p>
        ) : (
          <ul className="max-h-[26rem] space-y-3 overflow-y-auto pe-1">
            {items.map((item, index) => (
              <MistakeCard
                key={`${item.student_name}-${item.fragment}-${index}`}
                fragment={item.fragment}
                correction={item.correction}
                explanation={item.explanation}
                severity={item.severity}
                topic={item.topic}
                date={item.date}
                who={item.student_name}
              />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
