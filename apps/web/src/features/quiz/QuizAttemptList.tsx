import { Link } from "react-router-dom";
import { NavIcon } from "../../components/NavIcon";
import { useI18n } from "../../i18n/i18n";
import { accuracyOf, playedOn, secondsOf } from "./quiz.format";
import type { QuizAttempt } from "./quiz.types";

export function QuizAttemptList({ attempts, limit }: { attempts: QuizAttempt[]; limit?: number }) {
  const { t } = useI18n();

  if (attempts.length === 0) {
    return <p className="text-start text-sm text-muted">{t("quiz.empty.attempts")}</p>;
  }

  const shown = limit ? attempts.slice(0, limit) : attempts;

  return (
    <div className="space-y-3">
      {shown.map((attempt) => {
        const accuracy = accuracyOf(attempt);
        return (
          <Link
            key={attempt.session_id}
            to={`/quiz/report/${attempt.session_id}`}
            className="block rounded-2xl border border-edge/70 bg-panel/50 p-4 transition hover:-translate-y-0.5 hover:border-teal/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-start font-semibold">{attempt.lesson_topic}</div>
                <div className="truncate text-start text-xs text-muted">
                  {[attempt.group_name, attempt.subject, playedOn(attempt.played_at)]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {attempt.rank > 0 && (
                  <span
                    className={`chip ${attempt.rank === 1 ? "border-amber/50 text-amber" : ""}`}
                  >
                    {attempt.rank}/{attempt.players} {t("quiz.rank")}
                  </span>
                )}
                <span className="chip border-teal/40 text-teal">
                  {attempt.score} {t("quiz.score")}
                </span>
                <NavIcon name="chevron" className="h-4 w-4 text-muted" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal to-azure transition-[width] duration-700"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
              <span className="shrink-0 font-mono text-xs text-muted">
                {attempt.correct}/{attempt.total} · {secondsOf(attempt.avg_ms)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
