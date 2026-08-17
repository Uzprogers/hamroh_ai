import { Link } from "react-router-dom";
import { NavIcon } from "../../components/NavIcon";
import { useI18n } from "../../i18n/i18n";
import type { Lesson } from "../../lib/types";

export function LessonCards({ lessons, limit }: { lessons: Lesson[]; limit?: number }) {
  const { t } = useI18n();

  if (lessons.length === 0) {
    return <p className="text-start text-sm text-muted">{t("student.empty.lessons")}</p>;
  }

  const shown = limit ? lessons.slice(0, limit) : lessons;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {shown.map((lesson) => {
        const active = lesson.status === "ACTIVE";

        return (
          <Link
            key={lesson.id}
            to={`/lesson/${lesson.id}`}
            className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-teal/50 ${
              active
                ? "border-teal/50 bg-teal/5 shadow-glow"
                : "border-edge/70 bg-panel/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-teal ${
                  active ? "border-teal/50 bg-teal/10" : "border-edge bg-ink/30"
                }`}
              >
                <NavIcon name="lessons" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate text-start font-semibold">{lesson.topic}</div>
                  {active && (
                    <span className="shrink-0 rounded-full border border-teal/50 bg-teal/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-teal">
                      {t("lesson.status.ACTIVE")}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-start text-xs text-muted">{lesson.objective}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
