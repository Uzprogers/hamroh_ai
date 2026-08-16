import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/i18n";
import type { Lesson } from "../../lib/types";

export function LessonList({ lessons }: { lessons: Lesson[] }) {
  const { t } = useI18n();

  if (lessons.length === 0) {
    return <p className="text-sm text-muted">{t("teacher.empty.lessons")}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <Link
            to={`/lesson/${lesson.id}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-edge/70 bg-panel/50 px-4 py-3 transition hover:-translate-y-0.5 hover:border-teal/50"
          >
            <div className="min-w-0">
              <div className="truncate font-semibold">{lesson.topic}</div>
              <div className="truncate text-xs text-muted">{lesson.objective}</div>
            </div>
            <span
              className={`chip shrink-0 ${lesson.status === "ACTIVE" ? "border-teal/40 text-teal" : ""}`}
            >
              {lesson.status === "ACTIVE" ? t("teacher.published") : lesson.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
