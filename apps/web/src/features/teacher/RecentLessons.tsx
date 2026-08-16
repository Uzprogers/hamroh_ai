import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";
import type { Group, Lesson } from "../../lib/types";

const RECENT_LIMIT = 4;

interface TopicCard {
  key: string;
  lead: Lesson;
  classes: { id: string; name: string; lessonId: string }[];
}

export function RecentLessons({ lessons, groups }: { lessons: Lesson[]; groups: Group[] }) {
  const { t } = useI18n();

  if (lessons.length === 0) {
    return <p className="text-start text-sm text-muted">{t("teacher.empty.lessons")}</p>;
  }

  const groupById = new Map(groups.map((group) => [group.id, group]));
  const cards = new Map<string, TopicCard>();

  lessons.forEach((lesson) => {
    const key = lesson.topic.trim().toLowerCase();
    const card = cards.get(key) ?? { key, lead: lesson, classes: [] };
    const group = groupById.get(lesson.group_id);
    if (group) card.classes.push({ id: group.id, name: group.name, lessonId: lesson.id });
    cards.set(key, card);
  });

  return (
    <ul className="space-y-2.5">
      {[...cards.values()].slice(0, RECENT_LIMIT).map((card) => (
        <li
          key={card.key}
          className="rounded-2xl border border-edge/70 bg-panel/50 px-4 py-3 transition hover:border-teal/50"
        >
          <div className="flex items-start gap-3">
            <Link to={`/lesson/${card.lead.id}`} className="min-w-0 flex-1">
              <div className="truncate text-start font-semibold">{card.lead.topic}</div>
              <div className="truncate text-start text-xs text-muted">{card.lead.objective}</div>
            </Link>

            <span
              className={`chip shrink-0 ${
                card.lead.status === "ACTIVE" ? "border-teal/40 text-teal" : ""
              }`}
            >
              {t(`lesson.status.${card.lead.status}` as TranslationKey)}
            </span>

            <Link
              to={`/quiz/host/${card.lead.id}`}
              className="chip shrink-0 border-azure/40 text-azure transition hover:border-azure hover:text-paper"
            >
              {t("quiz.launch")}
            </Link>
          </div>

          {card.classes.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {card.classes.map((item) => (
                <Link
                  key={item.lessonId}
                  to={`/lesson/${item.lessonId}`}
                  className="rounded-full border border-edge bg-ink/25 px-2.5 py-0.5 text-xs font-semibold text-muted transition hover:border-teal/50 hover:text-teal"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
