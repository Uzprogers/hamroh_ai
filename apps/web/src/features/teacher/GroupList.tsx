import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/i18n";
import type { Group } from "../../lib/types";

export function GroupList({ groups }: { groups: Group[] }) {
  const { t } = useI18n();

  if (groups.length === 0) {
    return <p className="text-sm text-muted">{t("teacher.empty.groups")}</p>;
  }

  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {groups.map((group) => (
        <li key={group.id}>
          <Link
            to={`/group/${group.id}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-edge/70 bg-panel/50 px-4 py-3 transition hover:-translate-y-0.5 hover:border-teal/50"
          >
            <div className="min-w-0">
              <div className="truncate font-semibold">{group.name}</div>
              <div className="truncate text-xs text-muted">{group.subject}</div>
            </div>
            <span className="chip shrink-0">
              {group.member_count ?? 0} {t("teacher.members")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
