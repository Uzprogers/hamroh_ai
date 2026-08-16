import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { METRIC_ACCENT, METRIC_LABEL } from "./profile.metrics";
import { StatRing } from "./StatRing";
import { TrendChart } from "./TrendChart";
import { Avatar } from "../../components/Avatar";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { formatPhone } from "../../lib/phone";
import { useCountUp } from "../../lib/useCountUp";
import { useI18n } from "../../i18n/i18n";
import type { MetricValue, ProfileStats } from "../../lib/types";

function MetricTile({ metric }: { metric: MetricValue }) {
  const { t } = useI18n();
  const value = useCountUp(metric.value);

  return (
    <div className="surface relative overflow-hidden p-4">
      <span
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${METRIC_ACCENT[metric.key]}`}
      />
      <div className="font-display text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-xs leading-snug text-muted">{t(METRIC_LABEL[metric.key])}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ProfilePage() {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get<ProfileStats>("/profile/stats", token)
      .then(setStats)
      .catch(() => setFailed(true));
  }, [token]);

  if (!user) return null;

  const isTeacher = user.role === "TEACHER";
  const facts = [
    user.institution_name,
    isTeacher ? user.subject : user.grade_level,
    user.phone ? formatPhone(user.phone) : null,
    user.email,
  ].filter(Boolean) as string[];

  return (
    <div className="py-6">
      <Link to="/" className="chip hover:border-teal/50 hover:text-teal">
        {t("profile.back")}
      </Link>

      <header className="surface relative mt-4 overflow-hidden p-6 sm:p-8">
        <span className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-teal/25 to-azure/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <Avatar user={user} size="lg" ring />
            <div className="min-w-0">
              <span className="chip border-teal/40 text-teal">
                {t(isTeacher ? "auth.role.teacher" : "auth.role.student")}
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
                {user.first_name} {user.last_name}
              </h2>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                {facts.map((fact) => (
                  <span key={fact}>{fact}</span>
                ))}
              </div>
            </div>
          </div>

          {stats && <StatRing percent={stats.average_percent} label={t("profile.average")} />}
        </div>
      </header>

      {failed && (
        <p className="mt-4 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          {t("profile.failed")}
        </p>
      )}

      {!stats && !failed && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="skeleton h-24" />
          ))}
        </div>
      )}

      {stats && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.metrics.map((metric) => (
              <MetricTile key={metric.key} metric={metric} />
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Panel title={t("profile.trend")}>
              <TrendChart points={stats.trend} />
            </Panel>

            <Panel title={t(isTeacher ? "profile.breakdown.teacher" : "profile.breakdown.student")}>
              {stats.breakdown.length === 0 ? (
                <p className="text-sm text-muted">{t("profile.empty")}</p>
              ) : (
                <ul className="space-y-3.5">
                  {stats.breakdown.map((item) => (
                    <li key={item.label}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-semibold">{item.label}</span>
                        <span className="font-mono text-xs text-muted">{item.average_percent}%</span>
                      </div>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-edge">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-teal to-azure transition-[width] duration-700 ease-out"
                          style={{ width: `${item.average_percent}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title={t(isTeacher ? "profile.highlights.teacher" : "profile.highlights.student")}>
              {stats.highlights.length === 0 ? (
                <p className="text-sm text-muted">{t("profile.empty")}</p>
              ) : (
                <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {stats.highlights.map((item, index) => (
                    <li
                      key={`${item.label}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border border-edge bg-panel/60 p-3"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal/20 to-azure/10 font-display text-sm font-extrabold text-teal">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{item.label}</div>
                        <div className="truncate text-xs text-muted">{item.caption}</div>
                      </div>
                      <span className="font-mono text-sm">{item.percent}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
