import { Link, useSearchParams } from "react-router-dom";
import { FocusBar } from "./FocusBar";
import { LiveWorkspace } from "./LiveWorkspace";
import { SessionConsole } from "./SessionConsole";
import { useSession } from "./useSession";
import { Logo } from "../../components/Logo";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useI18n } from "../../i18n/i18n";

export function SessionPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();

  const session = useSession({
    lesson_id: params.get("lesson") ?? undefined,
    quiz_session_id: params.get("quiz") ?? undefined,
  });

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-edge/60 px-4 py-3 sm:px-5 sm:py-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Logo size={28} />
          <span className="whitespace-nowrap font-display font-extrabold brand-text">Hamroh AI</span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          {session.connected && (
            <button
              type="button"
              className="chip hover:border-coral/50 hover:text-coral"
              onClick={session.disconnect}
            >
              {t("session.end")}
            </button>
          )}
        </div>
      </header>

      {session.focus && <FocusBar focus={session.focus} />}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="relative flex min-h-0 flex-col overflow-hidden border-edge/60 lg:border-r">
          <div className="pointer-events-none absolute inset-0 grid-floor opacity-60" />
          <div className="relative flex min-h-0 flex-1 flex-col">
            <SessionConsole session={session} />
          </div>
        </section>

        <section className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <h2 className="mb-4 text-start font-display text-sm font-extrabold uppercase tracking-wide text-muted">
            {t("session.panel")}
          </h2>
          <LiveWorkspace session={session} />
        </section>
      </div>
    </div>
  );
}
