import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import { Panel } from "../../components/Panel";
import type { TranslationKey } from "../../i18n/dictionary";
import type { GroupMember } from "../../lib/types";

const SOURCE_STYLE: Record<GroupMember["source"], string> = {
  TEACHER: "",
  PIN: "border-teal/40 text-teal",
  CODE: "border-azure/40 text-azure",
  SCHOOL: "border-amber/40 text-amber",
};

export function MembersPanel({ groupId, code }: { groupId: string; code: string }) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    api
      .get<GroupMember[]>(`/groups/${groupId}/members`, token)
      .then(setMembers)
      .catch(() => setMembers([]));
  };

  useEffect(load, [groupId, token]);

  const remove = async (studentId: string) => {
    setBusy(studentId);
    try {
      await api.del(`/groups/${groupId}/members/${studentId}`, token);
      setMembers((rows) => rows.filter((row) => row.id !== studentId));
    } catch {
      load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title={t("group.members")}
      aside={
        <span className="chip border-teal/40 font-mono tracking-widest text-teal">
          {t("group.code")}: {code}
        </span>
      }
    >
      {members.length === 0 ? (
        <p className="text-start text-sm text-muted">{t("group.empty")}</p>
      ) : (
        <ul className="space-y-2.5">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-edge/70 bg-ink/25 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-start font-semibold">
                  {member.first_name} {member.last_name}
                </div>
                {member.grade_level && (
                  <div className="truncate text-start text-xs text-muted">{member.grade_level}</div>
                )}
              </div>

              <span className={`chip shrink-0 ${SOURCE_STYLE[member.source]}`}>
                {t(`group.source.${member.source}` as TranslationKey)}
              </span>

              <button
                type="button"
                className="chip shrink-0 transition hover:border-coral/60 hover:text-coral"
                disabled={busy === member.id}
                onClick={() => void remove(member.id)}
              >
                {t("group.member.remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
