import { NavLink } from "react-router-dom";
import { NavIcon, type NavIconName } from "./NavIcon";
import { useI18n } from "../i18n/i18n";
import type { TranslationKey } from "../i18n/dictionary";

export interface WorkspaceNavItem {
  to: string;
  icon: NavIconName;
  label: TranslationKey;
}

export function WorkspaceNav({
  items,
  counts = {},
}: {
  items: WorkspaceNavItem[];
  counts?: Record<string, number>;
}) {
  const { t } = useI18n();

  return (
    <nav className="surface flex gap-1 overflow-x-auto p-2 lg:flex-col">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-gradient-to-r from-teal/20 to-azure/10 text-teal"
                : "text-muted hover:bg-panel hover:text-paper"
            }`
          }
        >
          <NavIcon name={item.icon} />
          <span className="flex-1 text-start">{t(item.label)}</span>
          {counts[item.to] !== undefined && (
            <span className="font-mono text-xs text-muted">{counts[item.to]}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
