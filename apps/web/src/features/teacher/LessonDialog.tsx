import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GeneratingDialog } from "./GeneratingDialog";
import { Modal } from "../../components/Modal";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { Group, Lesson } from "../../lib/types";

const READY_MS = 900;

export function LessonDialog({
  groups,
  onClose,
  onCreated,
}: {
  groups: Group[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useI18n();
  const translateError = useTranslateError();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [form, setForm] = useState({ topic: "", note: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (!createdId) return;
    const timer = window.setTimeout(() => {
      onClose();
      navigate(`/lesson/${createdId}`);
    }, READY_MS);
    return () => window.clearTimeout(timer);
  }, [createdId]);

  const submit = async () => {
    if (!groupId || form.topic.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<{ lesson: Lesson }>(
        "/lessons",
        { group_id: groupId, topic: form.topic.trim(), note: form.note.trim() || undefined },
        token,
      );
      onCreated();
      setCreatedId(created.lesson.id);
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
      setBusy(false);
    }
  };

  if (busy) return <GeneratingDialog topic={form.topic.trim()} ready={Boolean(createdId)} />;

  return (
    <Modal
      icon="spark"
      title={t("teacher.newLesson")}
      subtitle={t("teacher.lesson.subtitle")}
      onClose={onClose}
    >
      {groups.length === 0 ? (
        <p className="rounded-xl border border-edge bg-ink/40 px-4 py-3 text-sm text-muted">
          {t("teacher.noGroups")}
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <span className="label">{t("teacher.selectGroup")}</span>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setGroupId(group.id)}
                  className={`rounded-xl border px-3 py-2 text-start transition ${
                    groupId === group.id
                      ? "border-teal/60 bg-gradient-to-br from-teal/20 to-azure/10"
                      : "border-edge bg-panel/60 hover:border-teal/40"
                  }`}
                >
                  <span className="block text-sm font-semibold">{group.name}</span>
                  <span className="block text-[11px] text-muted">{group.subject}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="lesson_topic">
              {t("teacher.topic")}
            </label>
            <input
              id="lesson_topic"
              className="field"
              value={form.topic}
              onChange={(event) => setForm({ ...form, topic: event.target.value })}
            />
          </div>

          <div>
            <label className="label" htmlFor="lesson_note">
              {t("teacher.note")}
            </label>
            <textarea
              id="lesson_note"
              className="field min-h-[84px] resize-none"
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
          </div>

          {error && (
            <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
              {error}
            </p>
          )}

          <button type="button" className="btn-primary w-full" onClick={submit}>
            {t("teacher.generate")}
          </button>
        </div>
      )}
    </Modal>
  );
}
