import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Orb } from "../../components/Orb";
import { Logo } from "../../components/Logo";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { ThemeToggle } from "../../components/ThemeToggle";
import { GradePreview } from "../../components/GradePreview";
import { useI18n } from "../../i18n/i18n";

export function AuthScreen({ children, energy = 0 }: { children: ReactNode; energy?: number }) {
  const { t } = useI18n();
  const [breath, setBreath] = useState(0.06);

  useEffect(() => {
    let frame = 0;
    const timer = setInterval(() => {
      frame += 1;
      setBreath(0.06 + Math.sin(frame / 14) * 0.035);
    }, 90);
    return () => clearInterval(timer);
  }, []);

  const level = Math.min(1, breath + energy);

  return (
    <div className="relative flex min-h-full flex-col lg:grid lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-edge/60 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 grid-floor opacity-70" />
        <div className="pointer-events-none absolute -right-[18%] top-[6%] h-[62%] w-[86%] opacity-80">
          <Orb level={level} state={energy > 0.12 ? "SPEAKING" : "IDLE"} distance={6.4} />
        </div>

        <Link to="/" className="relative flex items-center gap-3">
          <Logo size={34} />
          <span className="font-display text-xl font-extrabold brand-text">Hamroh AI</span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="font-display text-[42px] font-extrabold leading-[1.04]">
            {t("auth.hero.line1")}
            <br />
            <span className="brand-text">{t("auth.hero.line2")}</span>
          </h1>
          <p className="mt-5 text-muted">{t("tagline")}</p>
        </div>

        <div className="relative max-w-md">
          <GradePreview compact />
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
          <div className="w-full max-w-[440px] animate-rise">{children}</div>
        </div>
      </main>
    </div>
  );
}
