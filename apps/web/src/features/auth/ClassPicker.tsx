import { useI18n } from "../../i18n/i18n";
import type { School, SchoolClass } from "../../lib/types";

export function ClassPicker({
  schools,
  school,
  klass,
  onPick,
}: {
  schools: School[];
  school: School | null;
  klass: SchoolClass | null;
  onPick: (school: School, klass: SchoolClass | null) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {schools.map((item) => {
          const active = school?.name === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onPick(item, null)}
              className={`w-full rounded-2xl border px-4 py-3 text-start transition ${
                active
                  ? "border-teal/60 bg-gradient-to-br from-teal/15 to-azure/10"
                  : "border-edge bg-panel/60 hover:border-teal/40"
              }`}
            >
              <div className="text-sm font-semibold text-paper">{item.name}</div>
              <div className="mt-0.5 text-xs text-muted">
                {t("onboarding.class.count").replace("{n}", String(item.classes.length))}
              </div>
            </button>
          );
        })}
      </div>

      {school && (
        <div className="grid gap-2 sm:grid-cols-3">
          {school.classes.map((item) => {
            const active = klass?.name === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onPick(school, item)}
                className={`rounded-2xl border px-3 py-3 text-start transition ${
                  active
                    ? "border-teal/60 bg-gradient-to-br from-teal/20 to-azure/10"
                    : "border-edge bg-panel/60 hover:border-teal/40"
                }`}
              >
                <div className="font-display text-lg font-extrabold text-paper">{item.name}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  {item.subjects.join(" · ")}
                </div>
                <div className="mt-1 text-[11px] text-teal">
                  {t("onboarding.class.students").replace("{n}", String(item.student_count))}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
