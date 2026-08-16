import { useEffect, useRef, useState } from "react";
import { NavIcon } from "../../components/NavIcon";
import { useI18n } from "../../i18n/i18n";
import { formatShortDay } from "./group.format";
import type { GroupLessonSummary } from "./group.types";

function Option({
  label,
  meta,
  active,
  onSelect,
}: {
  label: string;
  meta?: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${
        active
          ? "bg-gradient-to-r from-teal/25 to-azure/10 text-paper"
          : "text-muted hover:bg-edge/40 hover:text-paper"
      }`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
          active ? "border-teal bg-teal/20 text-teal" : "border-edge text-transparent"
        }`}
      >
        <NavIcon name="check" className="h-3 w-3" />
      </span>
      <span className="min-w-0 flex-1 truncate text-start text-sm font-semibold">{label}</span>
      {meta && <span className="shrink-0 font-mono text-[10px] text-muted">{meta}</span>}
    </button>
  );
}

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
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (lessons.length === 0) return null;

  const active = lessons.find((lesson) => lesson.id === activeId) ?? null;
  const pick = (lessonId: string | null) => {
    onSelect(lessonId);
    setOpen(false);
  };

  return (
    <div ref={box} className="relative max-w-md">
      <span className="label">{t("group.topics")}</span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`field flex items-center justify-between gap-3 text-start ${
          open ? "border-teal/70" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`chip shrink-0 ${active ? "border-teal/40 text-teal" : "border-edge"}`}
          >
            {active ? formatShortDay(active.created_at) : lessons.length}
          </span>
          <span className="truncate text-start text-sm font-semibold text-paper">
            {active ? active.topic : t("group.allTopics")}
          </span>
        </span>
        <NavIcon
          name="caret"
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("group.topic.select")}
          className="surface animate-rise absolute inset-x-0 z-30 mt-2 max-h-80 space-y-1 overflow-y-auto p-2"
        >
          <Option
            label={t("group.allTopics")}
            meta={String(lessons.length)}
            active={activeId === null}
            onSelect={() => pick(null)}
          />
          {lessons.map((lesson) => (
            <Option
              key={lesson.id}
              label={lesson.topic}
              meta={formatShortDay(lesson.created_at)}
              active={activeId === lesson.id}
              onSelect={() => pick(lesson.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
