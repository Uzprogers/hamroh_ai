import { useI18n } from "../../i18n/i18n";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  detail?: string;
}

export function QuizLeaderboard({
  rows,
  meId,
  limit,
}: {
  rows: LeaderboardEntry[];
  meId?: string | null;
  limit?: number;
}) {
  const { t } = useI18n();
  const visible = limit ? rows.slice(0, limit) : rows;
  const peak = Math.max(1, ...rows.map((row) => row.score));

  if (!visible.length) {
    return <p className="text-sm text-muted">{t("quiz.waiting")}</p>;
  }

  return (
    <ol className="space-y-2">
      {visible.map((row, index) => (
        <li
          key={row.id}
          className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
            row.id === meId ? "border-teal/60 bg-teal/10" : "border-edge bg-panel/50"
          }`}
        >
          <span className="w-6 text-start font-mono text-xs text-muted">{index + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-paper">{row.name}</div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-edge">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal to-azure transition-[width] duration-500"
                style={{ width: `${Math.max(4, (row.score / peak) * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-end">
            <div className="font-mono text-sm font-bold text-teal">{row.score}</div>
            {row.detail && <div className="text-[10px] text-muted">{row.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
