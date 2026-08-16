import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";
import type { Lesson } from "../../lib/types";

export function LessonList({ lessons }: { lessons: Lesson[] }) {
  const { t } = useI18n();

  if (lessons.length === 0) {
    return <p className="text-sm text-muted">{t("teacher.empty.lessons")}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {lessons.map((lesson) => (
        <li
          key={lesson.id}
          className="flex items-center gap-3 rounded-2xl border border-edge/70 bg-panel/50 px-4 py-3 transition hover:border-teal/50"
        >
          <Link to={`/lesson/${lesson.id}`} className="min-w-0 flex-1">
            <div className="truncate font-semibold">{lesson.topic}</div>
            <div className="truncate text-xs text-muted">{lesson.objective}</div>
          </Link>

          <span
            className={`chip shrink-0 ${lesson.status === "ACTIVE" ? "border-teal/40 text-teal" : ""}`}
          >
            {t(`lesson.status.${lesson.status}` as TranslationKey)}
          </span>

          <Link
            to={`/quiz/host/${lesson.id}`}
            className="chip shrink-0 border-azure/40 text-azure transition hover:border-azure hover:text-paper"
          >
            {t("quiz.launch")}
          </Link>
        </li>
      ))}
    </ul>
  );
}
