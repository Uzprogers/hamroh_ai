import { NavIcon } from "../../components/NavIcon";
import { useI18n } from "../../i18n/i18n";
import type { StudentGroup } from "../../lib/types";

export function ClassCard({ group, onOpen }: { group: StudentGroup | null; onOpen: () => void }) {
  const { t } = useI18n();

  if (!group) {
    return (
      <section className="surface relative overflow-hidden p-6">
        <span className="pointer-events-none absolute -left-10 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-teal/25 to-azure/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-extrabold">{t("student.class.empty")}</h2>
            <p className="mt-1.5 text-start text-sm text-muted">{t("student.class.hint")}</p>
          </div>
          <button type="button" className="btn-primary" onClick={onOpen}>
            <NavIcon name="key" className="h-4 w-4" />
            {t("student.class.join")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="surface relative overflow-hidden p-6">
      <span className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-gradient-to-br from-teal/25 to-azure/15 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-teal/40 bg-gradient-to-br from-teal/20 to-azure/10 font-display text-lg font-extrabold text-teal">
            {group.name.slice(0, 4)}
          </span>
          <div className="min-w-0">
            <div className="text-start text-xs uppercase tracking-wide text-muted">
              {t("student.class")}
            </div>
            <div className="truncate text-start font-display text-xl font-extrabold">
              {group.name} · {group.subject}
            </div>
            <div className="truncate text-start text-sm text-muted">
              {group.teacher_name} · {group.member_count} {t("teacher.members")}
            </div>
          </div>
        </div>

        <button type="button" className="btn-ghost" onClick={onOpen}>
          <NavIcon name="key" className="h-4 w-4" />
          {t("student.class.change")}
        </button>
      </div>
    </section>
  );
}
