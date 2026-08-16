import { useEffect, useState, type FormEvent } from "react";
import { ApiError, api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import { NavIcon } from "../../components/NavIcon";
import type { SchoolGroup } from "../../lib/types";

const CODE_LENGTH = 6;

export function JoinGroupPanel({ onJoined }: { onJoined: () => void }) {
  const { token, user } = useAuth();
  const { t } = useI18n();

  const [code, setCode] = useState("");
  const [groups, setGroups] = useState<SchoolGroup[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const load = () => {
    api
      .get<SchoolGroup[]>("/groups/school", token)
      .then(setGroups)
      .catch(() => setGroups([]));
  };

  useEffect(load, [token]);

  const finish = () => {
    setCode("");
    load();
    onJoined();
  };

  const joinByCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("code");
    setFailure(null);
    try {
      await api.post("/groups/join", { code }, token);
      finish();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.code : "unknown");
    } finally {
      setBusy(null);
    }
  };

  const joinGroup = async (groupId: string) => {
    setBusy(groupId);
    setFailure(null);
    try {
      await api.post(`/groups/${groupId}/join`, {}, token);
      finish();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.code : "unknown");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="surface p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-extrabold">{t("group.join.title")}</h2>
        {user?.institution_name && <span className="chip">{user.institution_name}</span>}
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={joinByCode}>
        <div className="min-w-[180px] flex-1">
          <span className="label">{t("group.join.code")}</span>
          <input
            className="field text-center font-mono text-xl font-extrabold uppercase tracking-[0.3em]"
            autoComplete="off"
            placeholder={t("group.join.codeHint")}
            maxLength={CODE_LENGTH}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
            }
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={busy === "code" || code.length < 4}
        >
          {t("group.join.action")}
        </button>
      </form>

      <div className="mt-6">
        <span className="label">{t("group.join.school")}</span>
        {groups.length === 0 ? (
          <p className="text-start text-sm text-muted">{t("group.join.schoolEmpty")}</p>
        ) : (
          <ul className="space-y-2.5">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-edge/70 bg-ink/25 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-start font-semibold">
                    {group.name} · {group.subject}
                  </div>
                  <div className="truncate text-start text-xs text-muted">
                    {group.teacher_name} · {group.member_count} {t("teacher.members")}
                  </div>
                </div>

                {group.is_member ? (
                  <span className="chip border-teal/40 text-teal">
                    <NavIcon name="check" className="h-3.5 w-3.5" />
                    {t("group.join.member")}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost px-4 py-2"
                    disabled={busy === group.id}
                    onClick={() => void joinGroup(group.id)}
                  >
                    {t("group.join.action")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {failure && <p className="mt-4 text-start text-sm text-coral">{t("group.join.failed")}</p>}
    </section>
  );
}
