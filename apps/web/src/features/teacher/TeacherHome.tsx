import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { Group, Lesson } from "../../lib/types";

export function TeacherHome() {
  const { t } = useI18n();
  const translateError = useTranslateError();
  const { token, user } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [groupForm, setGroupForm] = useState({ name: "", subject: "" });
  const [lessonForm, setLessonForm] = useState({ group_id: "", topic: "", note: "" });
  const [generating, setGenerating] = useState(false);

  const reload = async () => {
    const [nextGroups, nextLessons] = await Promise.all([
      api.get<Group[]>("/groups", token),
      api.get<Lesson[]>("/lessons", token),
    ]);
    setGroups(nextGroups);
    setLessons(nextLessons);
    setLessonForm((prev) => ({ ...prev, group_id: prev.group_id || nextGroups[0]?.id || "" }));
  };

  useEffect(() => {
    reload().catch((err) => setError(translateError(err instanceof ApiError ? err.code : "network")));
  }, [token]);

  const createGroup = async () => {
    if (!groupForm.name.trim() || !groupForm.subject.trim()) return;
    await api.post<Group>(
      "/groups",
      { ...groupForm, institution_type: user?.institution_type ?? "SCHOOL" },
      token,
    );
    setGroupForm({ name: "", subject: "" });
    await reload();
  };

  const createLesson = async () => {
    if (!lessonForm.group_id || lessonForm.topic.trim().length < 3) return;
    setGenerating(true);
    setError(null);
    try {
      await api.post(
        "/lessons",
        { group_id: lessonForm.group_id, topic: lessonForm.topic, note: lessonForm.note || undefined },
        token,
      );
      setLessonForm((prev) => ({ ...prev, topic: "", note: "" }));
      await reload();
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="animate-rise">
        <h1 className="font-display text-3xl font-extrabold">{t("teacher.title")}</h1>
        <p className="mt-1 text-muted">{t("tagline")}</p>
      </section>

      {error && (
        <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>
      )}

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="surface p-6">
          <h2 className="font-display text-lg font-extrabold">{t("teacher.newGroup")}</h2>
          <div className="mt-4 space-y-3">
            <input
              className="field"
              placeholder={t("teacher.groupName")}
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
            />
            <input
              className="field"
              placeholder={t("teacher.subject")}
              value={groupForm.subject}
              onChange={(e) => setGroupForm({ ...groupForm, subject: e.target.value })}
            />
            <button type="button" className="btn-ghost w-full" onClick={createGroup}>
              {t("teacher.newGroup")}
            </button>
          </div>

          <div className="mt-6 space-y-2">
            {groups.length === 0 && <p className="text-sm text-muted">{t("teacher.empty.groups")}</p>}
            {groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between rounded-xl border border-edge/70 px-4 py-3">
                <div>
                  <div className="font-semibold">{group.name}</div>
                  <div className="text-xs text-muted">{group.subject}</div>
                </div>
                <span className="chip">
                  {group.member_count ?? 0} {t("teacher.members")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="font-display text-lg font-extrabold">{t("teacher.newLesson")}</h2>
          <div className="mt-4 space-y-3">
            <select
              className="field"
              value={lessonForm.group_id}
              onChange={(e) => setLessonForm({ ...lessonForm, group_id: e.target.value })}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} — {group.subject}
                </option>
              ))}
            </select>
            <input
              className="field"
              placeholder={t("teacher.topic")}
              value={lessonForm.topic}
              onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
            />
            <textarea
              className="field min-h-[84px] resize-none"
              placeholder={t("teacher.note")}
              value={lessonForm.note}
              onChange={(e) => setLessonForm({ ...lessonForm, note: e.target.value })}
            />
            <button type="button" className="btn-primary w-full" onClick={createLesson} disabled={generating}>
              {generating ? t("teacher.generating") : t("teacher.generate")}
            </button>
          </div>

          <div className="mt-6 space-y-2">
            {lessons.length === 0 && !generating && (
              <p className="text-sm text-muted">{t("teacher.empty.lessons")}</p>
            )}
            {generating && <div className="skeleton h-16" />}
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                to={`/lesson/${lesson.id}`}
                className="tilt flex items-center justify-between rounded-xl border border-edge/70 px-4 py-3 transition hover:border-teal/50"
              >
                <div>
                  <div className="font-semibold">{lesson.topic}</div>
                  <div className="text-xs text-muted">{lesson.objective}</div>
                </div>
                <span
                  className={`chip ${lesson.status === "ACTIVE" ? "border-teal/40 text-teal" : ""}`}
                >
                  {lesson.status === "ACTIVE" ? t("teacher.published") : lesson.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
