import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { NavIcon, type NavIconName } from "./NavIcon";
import { useI18n } from "../i18n/i18n";

export function Modal({
  icon,
  title,
  subtitle,
  onClose,
  children,
}: {
  icon: NavIconName;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/75 p-4 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="surface relative w-full max-w-[520px] animate-rise p-6 text-start sm:p-7"
      >
        <span className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-teal/20 via-transparent to-azure/20 opacity-70" />

        <div className="relative flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-teal/30 bg-gradient-to-br from-teal/20 to-azure/10 text-teal">
            <NavIcon name={icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-extrabold">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("auth.telegram.close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-edge text-muted transition hover:border-coral/50 hover:text-coral"
          >
            <NavIcon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
