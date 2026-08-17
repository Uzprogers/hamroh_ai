import { NavIcon } from "../../components/NavIcon";
import { useI18n } from "../../i18n/i18n";
import type { FocusHeadline } from "./session.types";

export function FocusBar({ focus }: { focus: FocusHeadline }) {
  const { t } = useI18n();
  const quiz = focus.kind === "QUIZ";

  return (
    <div className="animate-rise flex flex-wrap items-center gap-3 border-b border-edge/60 bg-panel/40 px-5 py-3">
      <span className={`chip ${quiz ? "border-amber/40 text-amber" : "border-teal/40 text-teal"}`}>
        <NavIcon name={quiz ? "stats" : "lessons"} className="h-3.5 w-3.5" />
        {t(quiz ? "session.focus.quiz" : "session.focus.lesson")}
      </span>

      <span className="min-w-0 truncate text-start font-display text-sm font-extrabold">
        {focus.title}
      </span>

      {focus.teacher_name && (
        <span className="chip">
          <NavIcon name="user" className="h-3.5 w-3.5" />
          {focus.teacher_name}
        </span>
      )}

      <span className="ms-auto flex flex-wrap items-center gap-2 text-xs text-muted">
        {[focus.group_name, focus.subject, focus.detail].filter(Boolean).map((part) => (
          <span key={part} className="chip">
            {part}
          </span>
        ))}
      </span>
    </div>
  );
}
