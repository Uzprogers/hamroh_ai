export function CodeInput({
  value,
  onChange,
  length,
  numeric = false,
  autoFocus = true,
}: {
  value: string;
  onChange: (next: string) => void;
  length: number;
  numeric?: boolean;
  autoFocus?: boolean;
}) {
  const clean = (raw: string) =>
    numeric ? raw.replace(/\D/g, "") : raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const cells = Array.from({ length }, (_, index) => value[index] ?? "");

  return (
    <label className="relative block">
      <input
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
        autoComplete="off"
        autoFocus={autoFocus}
        inputMode={numeric ? "numeric" : "text"}
        maxLength={length}
        value={value}
        onChange={(event) => onChange(clean(event.target.value).slice(0, length))}
      />
      <div className="flex justify-between gap-2">
        {cells.map((char, index) => (
          <span
            key={index}
            className={`grid h-14 flex-1 place-items-center rounded-2xl border font-mono text-2xl font-extrabold transition ${
              char
                ? "border-teal/60 bg-gradient-to-br from-teal/20 to-azure/10 text-paper"
                : index === value.length
                  ? "border-teal/40 bg-panel/60 text-muted"
                  : "border-edge bg-panel/40 text-muted"
            }`}
          >
            {char || "·"}
          </span>
        ))}
      </div>
    </label>
  );
}
