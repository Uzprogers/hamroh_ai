import { useMemo, useRef, useState } from "react";

const MAX_VISIBLE = 6;

export function Combobox({
  id,
  value,
  options,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<number | null>(null);

  const matches = useMemo(() => {
    const needle = value.trim().toLowerCase();
    const found = needle
      ? options.filter((option) => option.toLowerCase().includes(needle))
      : options;
    return found.slice(0, MAX_VISIBLE);
  }, [options, value]);

  const close = () => {
    blurTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  const pick = (option: string) => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    onChange(option);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        id={id}
        className="field"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={close}
      />

      {open && matches.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-xl border border-edge bg-panel/95 py-1 shadow-lift backdrop-blur-xl">
          {matches.map((option) => (
            <li key={option}>
              <button
                type="button"
                onMouseDown={() => pick(option)}
                className="block w-full px-4 py-2.5 text-start text-sm transition hover:bg-teal/10 hover:text-teal"
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
