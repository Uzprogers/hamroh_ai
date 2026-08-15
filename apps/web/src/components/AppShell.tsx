import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] grid-floor" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-6">
        <Link to="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-display text-lg font-extrabold brand-text">Hamroh AI</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-xs text-muted">{user.institution_name}</div>
              </div>
              <button type="button" onClick={logout} className="chip hover:border-coral/50 hover:text-coral">
                {t("auth.logout")}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">{children}</main>
    </div>
  );
}
