import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";
import type { Group, Lesson } from "../../lib/types";

interface LessonGroup {
  id: string;
  title: string;
  subject: string;
  lessons: Lesson[];
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const { t } = useI18n();

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-edge/70 bg-panel/50 px-4 py-3 transition hover:border-teal/50">
      <Link to={`/lesson/${lesson.id}`} className="min-w-0 flex-1">
        <div className="truncate text-start font-semibold">{lesson.topic}</div>
        <div className="truncate text-start text-xs text-muted">{lesson.objective}</div>
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
  );
}

export function LessonList({ lessons, groups }: { lessons: Lesson[]; groups?: Group[] }) {
  const { t } = useI18n();

  if (lessons.length === 0) {
    return <p className="text-start text-sm text-muted">{t("teacher.empty.lessons")}</p>;
  }

  if (!groups?.length) {
    return (
      <ul className="space-y-2.5">
        {lessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} />
        ))}
      </ul>
    );
  }

  const byGroup = new Map<string, LessonGroup>(
    groups.map((group) => [
      group.id,
      { id: group.id, title: group.name, subject: group.subject, lessons: [] },
    ]),
  );

  const orphans: Lesson[] = [];
  lessons.forEach((lesson) => {
    const bucket = byGroup.get(lesson.group_id);
    if (bucket) bucket.lessons.push(lesson);
    else orphans.push(lesson);
  });

  const sections = [...byGroup.values()].filter((section) => section.lessons.length > 0);

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.id}>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <Link to={`/group/${section.id}`} className="chip border-teal/40 text-teal">
              {section.title}
              {section.subject && (
                <span className="font-normal text-teal/70">· {section.subject}</span>
              )}
            </Link>
            <span className="text-start text-xs text-muted">
              {section.lessons.length} {t("teacher.lessonCount")}
            </span>
          </div>
          <ul className="space-y-2.5">
            {section.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} />
            ))}
          </ul>
        </section>
      ))}

      {orphans.length > 0 && (
        <section>
          <div className="mb-2.5 text-start text-xs text-muted">{t("teacher.lessons.other")}</div>
          <ul className="space-y-2.5">
            {orphans.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
