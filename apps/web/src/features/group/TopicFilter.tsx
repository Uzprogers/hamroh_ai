import { useI18n } from "../../i18n/i18n";
import { formatShortDay } from "./group.format";
import type { GroupLessonSummary } from "./group.types";

const ACTIVE =
  "border-transparent bg-gradient-to-r from-teal to-azure text-ink shadow-glow";
const IDLE = "hover:border-teal/50 hover:text-teal";

export function TopicFilter({
  lessons,
  activeId,
  onSelect,
}: {
  lessons: GroupLessonSummary[];
  activeId: string | null;
  onSelect: (lessonId: string | null) => void;
}) {
  const { t } = useI18n();

  if (lessons.length === 0) return null;

  return (
    <div>
      <h3 className="text-start font-display text-xs font-extrabold uppercase tracking-wide text-muted">
        {t("group.topics")}
      </h3>
      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`chip shrink-0 transition ${activeId === null ? ACTIVE : IDLE}`}
        >
          {t("group.allTopics")}
        </button>

        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            type="button"
            onClick={() => onSelect(lesson.id)}
            title={lesson.topic}
            className={`chip shrink-0 max-w-[220px] transition ${
              activeId === lesson.id ? ACTIVE : IDLE
            }`}
          >
            <span className="truncate">{lesson.topic}</span>
            <span className="shrink-0 font-mono text-[10px] opacity-70">
              {formatShortDay(lesson.created_at)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
