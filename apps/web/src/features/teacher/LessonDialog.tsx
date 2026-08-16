import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GeneratingDialog } from "./GeneratingDialog";
import { GROUP_NAMING } from "./group.const";
import { LESSON_OUTPUT, topicExamples } from "./lesson.const";
import { Modal } from "../../components/Modal";
import { NavIcon } from "../../components/NavIcon";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { Group, Lesson } from "../../lib/types";

const READY_MS = 900;
const TOPIC_MIN = 3;

interface GradeBucket {
  key: string;
  label: string;
  subject: string;
  groups: Group[];
}

function bucketKey(group: Group): string {
  return `${group.grade_level ?? "-"}|${group.subject.trim().toLowerCase()}`;
}

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
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { levelShort } = GROUP_NAMING[user?.institution_type ?? "SCHOOL"];

  const buckets = useMemo<GradeBucket[]>(() => {
    const map = new Map<string, GradeBucket>();
    groups.forEach((group) => {
      const key = bucketKey(group);
      const bucket = map.get(key) ?? {
        key,
        label: group.grade_level ? `${group.grade_level}` : "",
        subject: group.subject,
        groups: [],
      };
      bucket.groups.push(group);
      map.set(key, bucket);
    });
    return [...map.values()];
  }, [groups]);

  const [bucketIndex, setBucketIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>(() =>
    buckets[0] ? buckets[0].groups.map((group) => group.id) : [],
  );
  const [form, setForm] = useState({ topic: "", note: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const bucket = buckets[bucketIndex];
  const examples = topicExamples(bucket?.subject ?? "");
  const students = (bucket?.groups ?? [])
    .filter((group) => picked.includes(group.id))
    .reduce((total, group) => total + (group.member_count ?? 0), 0);
  const ready = picked.length > 0 && form.topic.trim().length >= TOPIC_MIN;

  useEffect(() => {
    if (!createdId) return;
    const timer = window.setTimeout(() => {
      onClose();
      navigate(`/lesson/${createdId}`);
    }, READY_MS);
    return () => window.clearTimeout(timer);
  }, [createdId]);

  const selectBucket = (index: number) => {
    setBucketIndex(index);
    setPicked(buckets[index].groups.map((group) => group.id));
  };

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<{ lesson: Lesson }>(
        "/lessons",
        {
          group_ids: picked,
          topic: form.topic.trim(),
          note: form.note.trim() || undefined,
        },
        token,
      );
      onCreated();
      setCreatedId(created.lesson.id);
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <GeneratingDialog
        topic={form.topic.trim()}
        classes={picked.length}
        ready={Boolean(createdId)}
      />
    );
  }

  return (
    <Modal
      icon="spark"
      title={t("teacher.newLesson")}
      subtitle={t("teacher.lesson.subtitle")}
      onClose={onClose}
    >
      {groups.length === 0 ? (
        <p className="rounded-xl border border-edge bg-ink/40 px-4 py-3 text-start text-sm text-muted">
          {t("teacher.noGroups")}
        </p>
      ) : (
        <div className="space-y-5">
          {buckets.length > 1 && (
            <div>
              <span className="label">{t("teacher.selectGrade")}</span>
              <div className="flex flex-wrap gap-2">
                {buckets.map((item, index) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => selectBucket(index)}
                    className={`rounded-xl border px-3.5 py-2 text-start transition ${
                      index === bucketIndex
                        ? "border-teal/60 bg-gradient-to-br from-teal/20 to-azure/10"
                        : "border-edge bg-panel/60 hover:border-teal/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {item.label && levelShort ? `${item.label}-${t(levelShort)}` : item.subject}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {item.subject} · {item.groups.length} {t("teacher.groupCount")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label">{t("teacher.selectGroup")}</span>
              {bucket && bucket.groups.length > 1 && (
                <button
                  type="button"
                  className="chip hover:border-teal/50 hover:text-teal"
                  onClick={() =>
                    setPicked(
                      picked.length === bucket.groups.length
                        ? []
                        : bucket.groups.map((group) => group.id),
                    )
                  }
                >
                  {t(picked.length === bucket.groups.length ? "teacher.clearAll" : "teacher.pickAll")}
                </button>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {(bucket?.groups ?? []).map((group) => {
                const active = picked.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggle(group.id)}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-start transition ${
                      active
                        ? "border-teal/60 bg-gradient-to-br from-teal/20 to-azure/10"
                        : "border-edge bg-panel/60 hover:border-teal/40"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                        active ? "border-teal bg-teal/25 text-teal" : "border-edge text-transparent"
                      }`}
                    >
                      <NavIcon name="check" className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{group.name}</span>
                      <span className="block text-[11px] text-muted">
                        {group.member_count ?? 0} {t("teacher.members")}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {picked.length > 1 && (
              <p className="mt-2 text-start text-xs text-teal">
                {t("teacher.sharedPlan")} · {picked.length} {t("teacher.groupCount")} · {students}{" "}
                {t("teacher.members")}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="lesson_topic">
              {t("teacher.topic")}
            </label>
            <input
              id="lesson_topic"
              className="field"
              placeholder={examples[0]}
              value={form.topic}
              onChange={(event) => setForm({ ...form, topic: event.target.value })}
            />
            <div className="mt-2.5 flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setForm({ ...form, topic: example })}
                  className="rounded-full border border-edge bg-panel/60 px-3 py-1 text-start text-xs font-semibold text-muted transition hover:border-teal/40 hover:text-teal"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="lesson_note">
              {t("teacher.note")}
            </label>
            <textarea
              id="lesson_note"
              className="field min-h-[72px] resize-none"
              placeholder={t("teacher.note.hint")}
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
          </div>

          <div className="rounded-2xl border border-edge/70 bg-ink/25 p-4">
            <span className="label mb-3">{t("teacher.willBuild")}</span>
            <ul className="space-y-2.5">
              {LESSON_OUTPUT.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-teal/40 bg-teal/10 text-teal">
                    <NavIcon name={item.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-start text-sm font-semibold">{t(item.title)}</span>
                    <span className="block text-start text-xs text-muted">{t(item.detail)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-start text-sm text-coral">
              {error}
            </p>
          )}

          <button type="button" className="btn-primary w-full" onClick={submit} disabled={!ready}>
            {t("teacher.generate")}
            {picked.length > 1 ? ` · ${picked.length} ${t("teacher.groupCount")}` : ""}
          </button>
        </div>
      )}
    </Modal>
  );
}
