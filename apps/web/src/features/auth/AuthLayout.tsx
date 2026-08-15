import type { ReactNode } from "react";
import { useI18n } from "../../i18n/i18n";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="grid gap-10 pt-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
      <section className="animate-rise">
        <div className="chip mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          {t("tagline")}
        </div>

        <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
          {t("auth.hero.line1")}
          <br />
          <span className="brand-text">{t("auth.hero.line2")}</span>
        </h1>

        <p className="mt-5 max-w-md text-muted">{subtitle}</p>

        <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
          {[
            { value: "45 → 4", unit: t("auth.stat.minutes"), label: t("auth.stat.marking") },
            { value: "3", unit: t("auth.stat.languages"), label: "uz · ru · en" },
            { value: "1", unit: t("auth.stat.voice"), label: t("auth.stat.companion") },
          ].map((stat) => (
            <div key={stat.label} className="surface tilt p-4">
              <div className="font-display text-2xl font-extrabold brand-text">{stat.value}</div>
              <div className="text-xs font-semibold text-paper/80">{stat.unit}</div>
              <div className="mt-1 text-[11px] text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface animate-rise p-7 sm:p-9">
        <h2 className="font-display text-2xl font-extrabold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        <div className="mt-7">{children}</div>
        <div className="mt-6 text-center text-sm">{footer}</div>
      </section>
    </div>
  );
}
