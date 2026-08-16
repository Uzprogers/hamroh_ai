import { useState } from "react";
import { Link } from "react-router-dom";
import { NavIcon } from "../../components/NavIcon";
import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";
import type { Group, Lesson } from "../../lib/types";

function topicKey(lesson: Lesson): string {
  return lesson.topic.trim().toLowerCase();
}

function LessonRow({ lesson, shared }: { lesson: Lesson; shared: string[] }) {
  const { t } = useI18n();

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-edge/70 bg-panel/50 px-4 py-3 transition hover:border-teal/50">
      <Link to={`/lesson/${lesson.id}`} className="min-w-0 flex-1">
        <div className="truncate text-start font-semibold">{lesson.topic}</div>
        <div className="truncate text-start text-xs text-muted">{lesson.objective}</div>
        {shared.length > 0 && (
          <div className="mt-1 text-start text-xs text-teal">
            {t("teacher.alsoIn")}: {shared.join(", ")}
          </div>
        )}
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

function ClassSection({
  group,
  lessons,
  sharedWith,
}: {
  group: Group;
  lessons: Lesson[];
  sharedWith: (lesson: Lesson) => string[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(lessons.length > 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-edge/70 bg-ink/20">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={lessons.length === 0}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-start disabled:cursor-default"
        >
          <NavIcon
            name="caret"
            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${
              open ? "" : "-rotate-90"
            } ${lessons.length === 0 ? "opacity-30" : ""}`}
          />
          <span className="min-w-0 truncate font-display text-sm font-extrabold">{group.name}</span>
          <span className="min-w-0 truncate text-xs text-muted">{group.subject}</span>
          <span className="ms-auto shrink-0 text-xs text-muted">
            {lessons.length} {t("teacher.lessonCount")}
          </span>
        </button>

        <Link
          to={`/group/${group.id}`}
          className="chip shrink-0 hover:border-teal/50 hover:text-teal"
        >
          {t("group.detail")}
        </Link>
      </div>

      {open && lessons.length > 0 && (
        <ul className="space-y-2.5 border-t border-edge/60 p-3">
          {lessons.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} shared={sharedWith(lesson)} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function LessonList({ lessons, groups }: { lessons: Lesson[]; groups?: Group[] }) {
  const { t } = useI18n();

  if (!groups?.length) {
    if (lessons.length === 0) {
      return <p className="text-start text-sm text-muted">{t("teacher.empty.lessons")}</p>;
    }
    return (
      <ul className="space-y-2.5">
        {lessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} shared={[]} />
        ))}
      </ul>
    );
  }

  const groupById = new Map(groups.map((group) => [group.id, group]));
  const byGroup = new Map<string, Lesson[]>(groups.map((group) => [group.id, []]));
  const orphans: Lesson[] = [];

  lessons.forEach((lesson) => {
    const bucket = byGroup.get(lesson.group_id);
    if (bucket) bucket.push(lesson);
    else orphans.push(lesson);
  });

  const classesByTopic = new Map<string, string[]>();
  lessons.forEach((lesson) => {
    const group = groupById.get(lesson.group_id);
    if (!group) return;
    const key = topicKey(lesson);
    classesByTopic.set(key, [...(classesByTopic.get(key) ?? []), group.name]);
  });

  const sharedWith = (lesson: Lesson): string[] => {
    const group = groupById.get(lesson.group_id);
    return (classesByTopic.get(topicKey(lesson)) ?? []).filter((name) => name !== group?.name);
  };

  return (
    <div className="space-y-2.5">
      {groups.map((group) => (
        <ClassSection
          key={group.id}
          group={group}
          lessons={byGroup.get(group.id) ?? []}
          sharedWith={sharedWith}
        />
      ))}

      {orphans.length > 0 && (
        <section>
          <div className="mb-2.5 text-start text-xs text-muted">{t("teacher.lessons.other")}</div>
          <ul className="space-y-2.5">
            {orphans.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} shared={[]} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
