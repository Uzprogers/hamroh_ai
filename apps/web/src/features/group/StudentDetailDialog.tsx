import { useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { StatRing } from "../profile/StatRing";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import { GrowthChip } from "./GrowthList";
import { MetricBar } from "./MetricBar";
import { MistakeCard, SeverityCounts } from "./MistakeCard";
import { Section } from "./Section";
import { TimelineChart } from "./TimelineChart";
import type { GroupStudentDetail } from "./group.types";

export function StudentDetailDialog({
  groupId,
  studentId,
  studentName,
  onClose,
}: {
  groupId: string;
  studentId: string;
  studentName: string;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [detail, setDetail] = useState<GroupStudentDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setFailed(false);

    api
      .get<GroupStudentDetail>(`/groups/${groupId}/students/${studentId}/detail`, token)
      .then((value) => !cancelled && setDetail(value))
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [groupId, studentId, token]);

  const timeline = detail?.timeline ?? [];
  const criteria = detail?.criteria ?? [];
  const mistakes = detail?.mistakes ?? [];
  const counts = detail?.severity_counts ?? { major: 0, minor: 0 };
  const empty = timeline.length === 0 && criteria.length === 0 && mistakes.length === 0;

  return (
    <Modal
      icon="groups"
      title={detail?.student.name ?? studentName}
      subtitle={t("group.detail")}
      onClose={onClose}
    >
      {failed && (
        <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-start text-sm text-coral">
          {t("profile.failed")}
        </p>
      )}

      {!failed && !detail && (
        <div className="space-y-4">
          <div className="skeleton h-32" />
          <div className="skeleton h-36" />
          <div className="skeleton h-24" />
        </div>
      )}

      {!failed && detail && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <StatRing percent={detail.average_percent} label={t("group.average")} />
            <div className="min-w-0 flex-1 space-y-2">
              <GrowthChip value={detail.growth_percent} />
              <div className="text-start text-xs text-muted">
                {detail.submissions} {t("group.submissions")}
              </div>
              <SeverityCounts major={counts.major} minor={counts.minor} />
            </div>
          </div>

          {empty ? (
            <p className="text-start text-sm text-muted">{t("group.student.empty")}</p>
          ) : (
            <>
              {timeline.length > 0 && (
                <Section title={t("group.timeline")}>
                  <TimelineChart points={timeline} />
                </Section>
              )}

              {criteria.length > 0 && (
                <Section title={t("group.criteria")}>
                  <div className="space-y-3.5">
                    {criteria.map((criterion, index) => (
                      <MetricBar
                        key={criterion.name}
                        label={criterion.name}
                        value={`${criterion.average_percent}%`}
                        percent={criterion.average_percent}
                        delayMs={index * 60}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {mistakes.length > 0 && (
                <Section title={t("group.mistakes")}>
                  <ul className="max-h-80 space-y-3 overflow-y-auto pe-1">
                    {mistakes.map((mistake, index) => (
                      <MistakeCard
                        key={`${mistake.fragment}-${index}`}
                        fragment={mistake.fragment}
                        correction={mistake.correction}
                        explanation={mistake.explanation}
                        severity={mistake.severity}
                        topic={mistake.topic}
                        date={mistake.date}
                      />
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
