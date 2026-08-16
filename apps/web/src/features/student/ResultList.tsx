import { useI18n } from "../../i18n/i18n";
import type { StudentResult } from "../../lib/types";

function percent(result: StudentResult): number {
  if (result.score === null || result.max_score === 0) return 0;
  return Math.round((result.score / result.max_score) * 100);
}

export function ResultList({ results, limit }: { results: StudentResult[]; limit?: number }) {
  const { t } = useI18n();

  if (results.length === 0) {
    return <p className="text-start text-sm text-muted">{t("student.empty.results")}</p>;
  }

  const shown = limit ? results.slice(0, limit) : results;

  return (
    <div className="space-y-3">
      {shown.map((result) => (
        <article
          key={result.submission_id}
          className="rounded-2xl border border-edge/70 bg-panel/50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-start font-semibold">{result.lesson_topic}</div>
            <span className="font-mono text-sm text-teal">
              {result.score ?? "—"} / {result.max_score}
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-edge">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal to-azure transition-[width] duration-700"
              style={{ width: `${percent(result)}%` }}
            />
          </div>

          <p className="mt-3 text-start text-sm text-muted">{result.feedback}</p>

          {result.mistakes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.mistakes.map((mistake, index) => (
                <span key={index} className="chip border-coral/30">
                  <span className="text-coral line-through">{mistake.fragment}</span>
                  <span className="text-muted">→</span>
                  <span className="text-teal">{mistake.correction}</span>
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
