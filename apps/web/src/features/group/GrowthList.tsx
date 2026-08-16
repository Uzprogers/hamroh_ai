import { useI18n } from "../../i18n/i18n";
import type { GroupGrowthLeader } from "./group.types";

export function GrowthChip({ value }: { value: number | null }) {
  const { t } = useI18n();

  if (value === null) {
    return <span className="chip shrink-0">{t("group.growth")} —</span>;
  }

  const positive = value >= 0;
  return (
    <span
      className={`chip shrink-0 font-mono ${
        positive ? "border-teal/40 text-teal" : "border-coral/40 text-coral"
      }`}
    >
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}

export function GrowthList({ leaders }: { leaders: GroupGrowthLeader[] }) {
  const { t } = useI18n();

  if (leaders.length === 0) {
    return <p className="text-start text-sm text-muted">{t("group.noGrowth")}</p>;
  }

  const peak = Math.max(...leaders.map((leader) => leader.growth_percent));

  return (
    <ol className="space-y-3">
      {leaders.map((leader, index) => (
        <li key={leader.student_id} className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal/20 to-azure/10 font-display text-sm font-extrabold text-teal">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-start text-sm font-semibold">{leader.name}</div>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-edge">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-teal to-azure transition-[width] duration-700 ease-out"
                style={{ width: `${peak > 0 ? (leader.growth_percent / peak) * 100 : 0}%` }}
              />
            </span>
          </div>
          <GrowthChip value={leader.growth_percent} />
        </li>
      ))}
    </ol>
  );
}
