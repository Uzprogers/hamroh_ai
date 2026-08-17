import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { NavIcon } from "../../components/NavIcon";
import { LessonAnalysis } from "./LessonAnalysis";
import { TeacherMaterial } from "./TeacherMaterial";
import { LiveWorkspace } from "../session/LiveWorkspace";
import { SessionConsole } from "../session/SessionConsole";
import { useSession } from "../session/useSession";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";
import type { Assignment, Lesson, StudentGroup, StudentResult } from "../../lib/types";

type StudioTab = "material" | "practice" | "analysis";

const TABS: { key: StudioTab; label: TranslationKey; icon: "lessons" | "spark" | "stats" }[] = [
  { key: "material", label: "studio.tab.material", icon: "lessons" },
  { key: "practice", label: "studio.tab.practice", icon: "spark" },
  { key: "analysis", label: "studio.tab.analysis", icon: "stats" },
];

export function StudentLessonPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useI18n();
  const session = useSession({ lesson_id: id });

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [group, setGroup] = useState<StudentGroup | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [tab, setTab] = useState<StudioTab>("material");

  const loadResults = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      api
        .get<StudentResult[]>("/results/mine", token)
        .then((rows) => setResults(rows.filter((row) => ids.includes(row.assignment_id))))
        .catch(() => undefined);
    },
    [token],
  );

  useEffect(() => {
    if (!id) return;
    void Promise.all([
      api.get<{ lesson: Lesson; assignments: Assignment[] }>(`/lessons/${id}`, token),
      api.get<StudentGroup[]>("/groups/mine", token).catch(() => [] as StudentGroup[]),
    ])
      .then(([detail, groups]) => {
        setLesson(detail.lesson);
        setAssignments(detail.assignments);
        setGroup(groups.find((row) => row.id === detail.lesson.group_id) ?? null);
        loadResults(detail.assignments.map((assignment) => assignment.id));
      })
      .catch(() => undefined);
  }, [id, token, loadResults]);

  const refresh = useCallback(
    () => loadResults(assignments.map((assignment) => assignment.id)),
    [assignments, loadResults],
  );

  const cards = session.panel.length;
  useEffect(() => {
    if (cards > 0) setTab("practice");
  }, [cards]);

  if (!lesson) return <div className="skeleton h-64" />;

  const teacher = session.focus?.teacher_name || group?.teacher_name || "";

  return (
    <div className="space-y-5 py-6">
      <Link to="/" className="chip">
        ← {t("student.title")}
      </Link>

      <section className="surface animate-rise relative overflow-hidden p-6 sm:p-7">
        <span className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-gradient-to-br from-teal/25 to-azure/20 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-start font-display text-2xl font-extrabold sm:text-3xl">
              {lesson.topic}
            </h1>
            <p className="mt-2 max-w-2xl text-start text-muted">{lesson.objective}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {teacher && (
                <span className="chip">
                  <NavIcon name="user" className="h-3.5 w-3.5" />
                  {teacher}
                </span>
              )}
              {group && <span className="chip">{group.name}</span>}
              {group && <span className="chip">{group.subject}</span>}
            </div>
          </div>

          {!session.connected && (
            <button type="button" className="btn-primary" onClick={session.connect}>
              <NavIcon name="spark" className="h-4 w-4" />
              {t("studio.start")}
            </button>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start">
        <aside className="surface sticky top-4 flex h-[620px] flex-col overflow-hidden p-0 lg:h-[calc(100vh-7rem)]">
          <SessionConsole session={session} />
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`chip transition ${
                  tab === item.key ? "border-teal/60 bg-teal/10 text-teal" : "hover:border-teal/40"
                }`}
              >
                <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                {t(item.label)}
                {item.key === "practice" && session.panel.length > 0 && (
                  <span className="font-mono text-[10px]">{session.panel.length}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "material" && (
            <TeacherMaterial lesson={lesson} assignments={assignments} onGraded={refresh} />
          )}
          {tab === "practice" && <LiveWorkspace session={session} />}
          {tab === "analysis" && <LessonAnalysis results={results} />}
        </div>
      </div>
    </div>
  );
}
