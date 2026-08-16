import { useI18n } from "../../i18n/i18n";
import { formatDay, isMajor } from "./group.format";

export function SeverityChip({ severity }: { severity: string }) {
  const { t } = useI18n();
  const major = isMajor(severity);

  return (
    <span
      className={`chip shrink-0 ${
        major ? "border-coral/40 bg-coral/10 text-coral" : "border-amber/40 bg-amber/10 text-amber"
      }`}
    >
      {t(major ? "group.severity.major" : "group.severity.minor")}
    </span>
  );
}

export function SeverityCounts({ major, minor }: { major: number; minor: number }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap gap-2">
      <span className="chip border-coral/40 bg-coral/10 font-mono text-coral">
        {t("group.severity.major")} {major}
      </span>
      <span className="chip border-amber/40 bg-amber/10 font-mono text-amber">
        {t("group.severity.minor")} {minor}
      </span>
    </div>
  );
}

export function MistakeCard({
  fragment,
  correction,
  explanation,
  severity,
  topic,
  date,
  who,
}: {
  fragment: string;
  correction: string;
  explanation: string;
  severity: string;
  topic: string;
  date: string;
  who?: string;
}) {
  const { t } = useI18n();

  return (
    <li className="rounded-2xl border border-edge/70 bg-ink/25 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityChip severity={severity} />
        {who && <span className="chip border-teal/40 text-teal">{who}</span>}
        {topic && <span className="truncate text-start text-xs text-muted">{topic}</span>}
        {date && <span className="ms-auto shrink-0 font-mono text-[10px] text-muted">{formatDay(date)}</span>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-coral/30 bg-coral/10 px-2 py-1 text-start text-sm text-coral line-through decoration-coral/50">
          {fragment}
        </span>
        <span className="font-mono text-xs text-muted">→</span>
        <span className="rounded-lg border border-teal/30 bg-teal/10 px-2 py-1 text-start text-sm text-teal">
          {correction}
        </span>
      </div>

      {explanation && (
        <p className="mt-2.5 text-start text-xs leading-relaxed text-muted">
          <span className="font-semibold uppercase tracking-wide">{t("group.explanation")}:</span>{" "}
          {explanation}
        </p>
      )}
    </li>
  );
}
