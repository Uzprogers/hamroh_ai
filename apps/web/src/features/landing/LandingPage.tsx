import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Orb } from "../../components/Orb";
import { Logo } from "../../components/Logo";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Reveal } from "./Reveal";
import { StepIcon } from "../../components/StepIcon";
import { FeatureIcon } from "./FeatureIcon";
import { GradePreview } from "../../components/GradePreview";
import { useI18n } from "../../i18n/i18n";
import type { TranslationKey } from "../../i18n/dictionary";

function Eyebrow({ children }: { children: string }) {
  return (
    <span className="chip">
      <span className="h-1.5 w-1.5 rounded-full bg-teal" />
      {children}
    </span>
  );
}

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative mx-auto w-full max-w-6xl px-5 py-20 sm:py-24 ${className}`}>
      {children}
    </section>
  );
}

function Waveform() {
  return (
    <div className="flex h-24 items-end justify-center gap-1.5">
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="w-1.5 rounded-full bg-gradient-to-t from-azure to-teal"
          style={{
            height: `${18 + Math.abs(Math.sin(index * 0.7)) * 70}%`,
            animation: `pulseRing 1.8s ease-in-out ${index * 60}ms infinite`,
            opacity: 0.45 + Math.abs(Math.sin(index * 0.9)) * 0.55,
          }}
        />
      ))}
    </div>
  );
}

export function LandingPage() {
  const { t } = useI18n();
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let current = 0;
    let frame = 0;

    const tick = () => {
      const span = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const target = Math.min(1, window.scrollY / span);
      current += (target - current) * 0.05;

      if (orbRef.current) {
        const drift = -Math.sin(current * Math.PI) * 58;
        const lift = Math.sin(current * Math.PI * 2) * 9;
        orbRef.current.style.transform = `translate3d(${drift}vw, ${lift}vh, 0) scale(${1 - Math.sin(current * Math.PI) * 0.16})`;
        orbRef.current.style.opacity = String(0.82 - Math.sin(current * Math.PI) * 0.34);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const steps = [1, 2, 3, 4].map((n) => ({
    n,
    title: t(`landing.how.step${n}.title` as TranslationKey),
    text: t(`landing.how.step${n}.text` as TranslationKey),
  }));

  const features = [1, 2, 3, 4, 5, 6].map((n) => ({
    n,
    title: t(`landing.feature${n}.title` as TranslationKey),
    text: t(`landing.feature${n}.text` as TranslationKey),
  }));

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[520px] grid-floor" />
      <div
        ref={orbRef}
        className="pointer-events-none fixed right-[-10vw] top-[8vh] -z-10 hidden h-[74vh] w-[74vh] will-change-transform [mask-image:radial-gradient(closest-side,black,transparent)] lg:block"
      >
        <Orb level={0.06} state="IDLE" distance={6.1} />
      </div>

      <header className="sticky top-0 z-30 border-b border-edge/40 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Logo size={30} />
            <span className="font-display text-lg font-extrabold brand-text">Hamroh AI</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link to="/login" className="btn-primary px-5 py-2.5 text-sm">
              {t("landing.nav.login")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </header>

      <Section className="grid min-h-[86vh] items-center gap-12 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <Reveal delay={80}>
            <h1 className="font-display text-[42px] font-extrabold leading-[1.04] sm:text-[56px]">
              {t("auth.hero.line1")}
              <br />
              <span className="brand-text">{t("auth.hero.line2")}</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-lg text-lg text-muted">{t("landing.hero.text")}</p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary px-7 py-3.5">
                {t("landing.hero.cta")}
                <span aria-hidden="true">→</span>
              </Link>
              <a href="#how" className="btn-ghost px-7 py-3.5">
                {t("landing.hero.secondary")}
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={320}>
          <GradePreview />
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <Eyebrow>{t("landing.problem.eyebrow")}</Eyebrow>
          <h2 className="mt-5 max-w-2xl font-display text-3xl font-extrabold sm:text-[42px]">
            {t("landing.problem.title")}
          </h2>
          <p className="mt-4 max-w-xl text-muted">{t("landing.problem.text")}</p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Reveal key={n} delay={n * 90}>
              <div className="surface tilt h-full p-6">
                <div className="font-display text-4xl font-extrabold text-coral">
                  {t(`landing.problem.card${n}.value` as TranslationKey)}
                </div>
                <div className="mt-3 font-display text-lg font-bold">
                  {t(`landing.problem.card${n}.title` as TranslationKey)}
                </div>
                <p className="mt-2 text-sm text-muted">
                  {t(`landing.problem.card${n}.text` as TranslationKey)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="how">
        <Reveal>
          <Eyebrow>{t("landing.how.eyebrow")}</Eyebrow>
          <h2 className="mt-5 max-w-2xl font-display text-3xl font-extrabold sm:text-[42px]">
            {t("landing.how.title")}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.n} delay={index * 110}>
              <div className="surface tilt h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-teal/35 bg-gradient-to-br from-teal/20 to-azure/10 text-teal">
                    <StepIcon step={step.n} />
                  </span>
                  <span className="font-mono text-xs text-muted">0{step.n}</span>
                </div>
                <div className="mt-5 font-display text-lg font-bold">{step.title}</div>
                <p className="mt-2 text-sm text-muted">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>{t("landing.voice.eyebrow")}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-extrabold sm:text-[42px]">
              {t("landing.voice.title")}
            </h2>
            <p className="mt-4 text-muted">{t("landing.voice.text")}</p>

            <ul className="mt-7 space-y-3">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                  {t(`landing.voice.point${n}` as TranslationKey)}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={140}>
            <div className="surface p-7">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("landing.voice.live")}
              </div>
              <div className="mt-6">
                <Waveform />
              </div>
              <p className="mt-6 text-sm text-muted">{t("landing.voice.sample")}</p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section>
        <Reveal>
          <Eyebrow>{t("landing.features.eyebrow")}</Eyebrow>
          <h2 className="mt-5 max-w-2xl font-display text-3xl font-extrabold sm:text-[42px]">
            {t("landing.features.title")}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.n} delay={index * 70}>
              <div className="surface tilt h-full p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-azure/30 bg-gradient-to-br from-azure/20 to-teal/10 text-azure">
                  <FeatureIcon feature={feature.n} />
                </span>
                <div className="mt-5 font-display text-lg font-bold">{feature.title}</div>
                <p className="mt-2 text-sm text-muted">{feature.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <Reveal>
          <div className="surface relative overflow-hidden p-10 text-center sm:p-14">
            <div className="pointer-events-none absolute inset-0 opacity-70 grid-floor" />
            <h2 className="relative font-display text-3xl font-extrabold sm:text-[42px]">
              {t("landing.cta.title")}
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-muted">{t("landing.cta.text")}</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/login" className="btn-primary px-8 py-3.5">
                {t("landing.cta.button")}
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/register" className="btn-ghost px-8 py-3.5">
                {t("landing.nav.register")}
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>

      <footer className="border-t border-edge/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={22} />
            <span className="font-display font-extrabold brand-text">Hamroh AI</span>
          </div>
          <span>{t("landing.footer")}</span>
        </div>
      </footer>
    </div>
  );
}
