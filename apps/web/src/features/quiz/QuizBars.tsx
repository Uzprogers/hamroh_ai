export interface BarDatum {
  key: string;
  label: string;
  value: number;
  barClass: string;
  highlight?: boolean;
}

export function QuizBars({ data, height = "h-40" }: { data: BarDatum[]; height?: string }) {
  const peak = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className={`flex items-end gap-3 ${height}`}>
      {data.map((item, index) => (
        <div key={item.key} className="flex h-full flex-1 flex-col justify-end">
          <span className="mb-1.5 text-center font-mono text-xs font-bold text-paper">
            {item.value}
          </span>
          <span
            className={`w-full rounded-t-lg transition-[height] duration-500 ease-out ${item.barClass} ${
              item.highlight ? "ring-2 ring-teal ring-offset-2 ring-offset-panel" : ""
            }`}
            style={{
              height: `${Math.max(3, (item.value / peak) * 100)}%`,
              transitionDelay: `${index * 40}ms`,
            }}
          />
          <span className="mt-2 truncate text-center text-[10px] text-muted" title={item.label}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
