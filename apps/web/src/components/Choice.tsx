export function Choice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-2 rounded-xl border border-edge bg-ink/60 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            value === option.value
              ? "bg-gradient-to-r from-teal to-azure text-ink"
              : "text-muted hover:text-paper"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
