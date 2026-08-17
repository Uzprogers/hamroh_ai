import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n/i18n";

function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-full border border-edge bg-panel/60 py-1 pe-3 ps-1 transition hover:border-teal/50"
      >
        <Avatar user={user} size="sm" ring />
        <span className="hidden text-start sm:block">
          <span className="block text-sm font-semibold leading-tight">{user.first_name}</span>
          <span className="block text-[11px] leading-tight text-muted">
            {t(user.role === "TEACHER" ? "auth.role.teacher" : "auth.role.student")}
          </span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="surface absolute end-0 top-full z-30 mt-2 w-56 overflow-hidden p-1.5 text-start"
        >
          <div className="border-b border-edge/70 px-3 pb-2.5 pt-2">
            <div className="truncate text-sm font-semibold">
              {user.first_name} {user.last_name}
            </div>
            <div className="truncate text-xs text-muted">{user.institution_name}</div>
          </div>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="mt-1.5 block rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-teal/10 hover:text-teal"
          >
            {t("nav.profile")}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="block w-full rounded-xl px-3 py-2.5 text-start text-sm font-semibold transition hover:bg-coral/10 hover:text-coral"
          >
            {t("auth.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] grid-floor" />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-5 sm:py-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Logo size={30} />
          <span className="whitespace-nowrap font-display text-base font-extrabold brand-text sm:text-lg">
            Hamroh AI
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 sm:px-5">{children}</main>
    </div>
  );
}
