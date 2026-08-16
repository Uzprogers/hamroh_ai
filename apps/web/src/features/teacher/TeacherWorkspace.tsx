import { useCallback, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { GroupDialog } from "./GroupDialog";
import { GroupList } from "./GroupList";
import { LessonDialog } from "./LessonDialog";
import { LessonList } from "./LessonList";
import { RecentLessons } from "./RecentLessons";
import { TEACHER_NAV } from "./teacher.nav";
import { NavIcon } from "../../components/NavIcon";
import { Panel } from "../../components/Panel";
import { WorkspaceNav } from "../../components/WorkspaceNav";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { Group, Lesson } from "../../lib/types";

export function TeacherWorkspace() {
  const { t } = useI18n();
  const translateError = useTranslateError();
  const { token, user } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"group" | "lesson" | null>(null);

  const reload = useCallback(async () => {
    try {
      const [nextGroups, nextLessons] = await Promise.all([
        api.get<Group[]>("/groups", token),
        api.get<Lesson[]>("/lessons", token),
      ]);
      setGroups(nextGroups);
      setLessons(nextLessons);
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
    }
  }, [token, translateError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const counts: Record<string, number> = {
    "/groups": groups.length,
    "/lessons": lessons.length,
  };

  const newGroup = (
    <button type="button" className="chip hover:border-teal/50 hover:text-teal" onClick={() => setDialog("group")}>
      <NavIcon name="plus" className="h-3.5 w-3.5" />
      {t("teacher.newGroup")}
    </button>
  );

  const newLesson = (
    <button type="button" className="chip hover:border-teal/50 hover:text-teal" onClick={() => setDialog("lesson")}>
      <NavIcon name="plus" className="h-3.5 w-3.5" />
      {t("teacher.newLesson")}
    </button>
  );

  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[236px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <WorkspaceNav items={TEACHER_NAV} counts={counts} />

        <div className="mt-3 grid gap-2">
          <button type="button" className="btn-primary w-full" onClick={() => setDialog("lesson")}>
            <NavIcon name="spark" className="h-4 w-4" />
            {t("teacher.newLesson")}
          </button>
          <button type="button" className="btn-ghost w-full" onClick={() => setDialog("group")}>
            <NavIcon name="plus" className="h-4 w-4" />
            {t("teacher.newGroup")}
          </button>
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        <header className="surface relative overflow-hidden p-5 sm:p-6">
          <span className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-teal/25 to-azure/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{t("teacher.title")}</h1>
              <p className="mt-1 text-sm text-muted">
                {user?.institution_name} {user?.subject ? `· ${user.subject}` : ""}
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="rounded-2xl border border-edge bg-panel/60 px-4 py-2 text-center">
                <span className="block font-display text-xl font-extrabold">{groups.length}</span>
                <span className="block text-[10px] uppercase tracking-wide text-muted">
                  {t("teacher.groups")}
                </span>
              </span>
              <span className="rounded-2xl border border-edge bg-panel/60 px-4 py-2 text-center">
                <span className="block font-display text-xl font-extrabold">{lessons.length}</span>
                <span className="block text-[10px] uppercase tracking-wide text-muted">
                  {t("teacher.lessons")}
                </span>
              </span>
            </div>
          </div>
        </header>

        {error && (
          <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </p>
        )}

        <Routes>
          <Route
            path="/groups"
            element={
              <Panel title={t("teacher.groups")} aside={newGroup}>
                <GroupList groups={groups} />
              </Panel>
            }
          />
          <Route
            path="/lessons"
            element={
              <Panel title={t("teacher.lessons")} aside={newLesson}>
                <LessonList lessons={lessons} groups={groups} />
              </Panel>
            }
          />
          <Route
            path="*"
            element={
              <div className="space-y-4">
                <Panel title={t("teacher.recent")} aside={newLesson}>
                  <RecentLessons lessons={lessons} groups={groups} />
                </Panel>
                <Panel title={t("teacher.groups")} aside={newGroup}>
                  <GroupList groups={groups} />
                </Panel>
              </div>
            }
          />
        </Routes>
      </div>

      {dialog === "group" && (
        <GroupDialog onClose={() => setDialog(null)} onCreated={() => void reload()} />
      )}
      {dialog === "lesson" && (
        <LessonDialog
          groups={groups}
          onClose={() => setDialog(null)}
          onCreated={() => void reload()}
        />
      )}
    </div>
  );
}
