import { StatRing } from "../../components/StatRing";
import { useI18n } from "../../i18n/i18n";
import type { StudentResult } from "../../lib/types";

export function LessonAnalysis({ results }: { results: StudentResult[] }) {
  const { t } = useI18n();

  if (!results.length) {
    return (
      <div className="surface grid min-h-[220px] place-items-center p-8 text-center text-sm text-muted">
        {t("studio.analysis.empty")}
      </div>
    );
  }

  const graded = results.filter((result) => result.score !== null);
  const average = graded.length
    ? Math.round(
        (graded.reduce((sum, result) => sum + (result.score ?? 0) / result.max_score, 0) /
          graded.length) *
          100,
      )
    : 0;
  const mistakes = results.flatMap((result) => result.mistakes);
  const major = mistakes.filter((mistake) => mistake.severity === "MAJOR").length;

  return (
    <div className="space-y-4">
      <section className="surface flex flex-wrap items-center justify-between gap-6 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="text-start font-display text-sm font-extrabold uppercase tracking-wide text-muted">
            {t("studio.analysis.title")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip">
              {graded.length} {t("studio.analysis.graded")}
            </span>
            <span className="chip">
              {mistakes.length} {t("studio.analysis.mistakes")}
            </span>
            <span className={`chip ${major ? "border-coral/50 text-coral" : ""}`}>
              {major} {t("studio.analysis.major")}
            </span>
          </div>
        </div>

        <StatRing percent={average} label={t("student.stat.average")} />
      </section>

      {results.map((result) => (
        <article key={result.submission_id} className="surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="min-w-0 text-start text-sm font-semibold">{result.question}</p>
            <span className="chip font-mono">
              {result.score ?? "—"}/{result.max_score}
            </span>
          </div>

          {result.answer && (
            <p className="mt-3 rounded-xl border border-edge/60 bg-panel/40 px-3 py-2 text-start text-sm text-muted">
              {result.answer}
            </p>
          )}

          {result.feedback && <p className="mt-3 text-start text-sm">{result.feedback}</p>}

          {result.mistakes.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.mistakes.map((mistake, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded bg-coral/15 px-2 py-0.5 text-coral line-through">
                    {mistake.fragment}
                  </span>
                  <span className="text-muted">→</span>
                  <span className="rounded bg-teal/15 px-2 py-0.5 text-teal">
                    {mistake.correction}
                  </span>
                  <span className="text-start text-xs text-muted">{mistake.explanation}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
