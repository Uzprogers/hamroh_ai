import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Backdrop } from "../../components/Backdrop";
import { Logo } from "../../components/Logo";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { ThemeToggle } from "../../components/ThemeToggle";
import { GradePreview } from "../../components/GradePreview";
import { useI18n } from "../../i18n/i18n";

export function AuthScreen({ children, energy = 0 }: { children: ReactNode; energy?: number }) {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-full flex-col lg:grid lg:grid-cols-[1.02fr_1fr]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Backdrop style={{ opacity: 0.75 + Math.min(0.25, energy) }} />
      </div>

      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:p-10 xl:p-12">
        <span className="pointer-events-none absolute inset-y-16 right-0 w-px bg-gradient-to-b from-transparent via-edge to-transparent" />

        <Link to="/" className="relative flex items-center gap-3">
          <Logo size={34} />
          <span className="font-display text-xl font-extrabold brand-text">Hamroh AI</span>
        </Link>

        <div className="relative mt-10">
          <h1 className="font-display text-[38px] font-extrabold leading-[1.04] xl:text-[44px]">
            {t("auth.hero.line1")}
            <br />
            <span className="brand-text">{t("auth.hero.line2")}</span>
          </h1>
          <p className="mt-4 max-w-lg text-muted">{t("tagline")}</p>
        </div>

        <div className="relative mt-8 flex flex-1 pb-2">
          <GradePreview />
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 lg:invisible">
            <Logo size={26} />
            <span className="font-display font-extrabold brand-text">Hamroh AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="relative w-full max-w-[540px] animate-rise">
            <span className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-br from-teal/12 via-transparent to-azure/12 blur-2xl" />
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
