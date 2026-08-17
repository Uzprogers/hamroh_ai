import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Orb } from "../../components/Orb";
import { PanelCard } from "./PanelCard";
import { useVoiceSession } from "./useVoiceSession";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import { Logo } from "../../components/Logo";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { ThemeToggle } from "../../components/ThemeToggle";

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function SessionPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const {
    connected,
    connecting,
    state,
    lines,
    panel,
    level,
    holding,
    elapsed,
    error,
    setError,
    connect,
    disconnect,
    startHolding,
    stopHolding,
    sendText,
  } = useVoiceSession();

  const transcriptRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const sendTyped = () => {
    if (!sendText(typed)) return;
    setTyped("");
  };

  const stateLabel = {
    IDLE: t("session.idle"),
    LISTENING: t("session.listening"),
    THINKING: t("session.thinking"),
    SPEAKING: t("session.speaking"),
  }[state];

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-edge/60 px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <Logo size={28} />
          <span className="font-display font-extrabold brand-text">Hamroh AI</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="chip">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                state === "SPEAKING" ? "bg-teal" : state === "THINKING" ? "bg-amber" : "bg-muted"
              }`}
            />
            {stateLabel}
          </span>
          {connected && (
            <span className="chip font-mono" title={t("session.elapsed")}>
              {formatElapsed(elapsed)}
            </span>
          )}
          <ThemeToggle />
          <LanguageSwitcher />
          {connected ? (
            <button type="button" className="chip hover:border-coral/50 hover:text-coral" onClick={disconnect}>
              {t("session.end")}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary px-4 py-2 disabled:opacity-60"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? t("session.connecting") : t("session.connect")}
            </button>
          )}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="relative flex min-h-0 flex-col overflow-hidden border-edge/60 lg:border-r">
          <div className="pointer-events-none absolute inset-0 grid-floor opacity-60" />

          <div className="relative min-h-[220px] flex-1">
            <Orb level={level} state={state} />
          </div>

          <div className="relative shrink-0 px-6 pb-6">
            <div
              ref={transcriptRef}
              className="mb-4 max-h-32 space-y-2 overflow-y-auto pr-1"
              aria-live="polite"
            >
              {lines.length === 0 && (
                <p className="text-sm text-muted">{t("session.transcript.empty")}</p>
              )}
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={`animate-rise text-sm ${
                    line.who === "hamroh" ? "text-paper" : "text-muted"
                  }`}
                >
                  <span className="mr-2 font-mono text-[10px] uppercase tracking-wide text-teal">
                    {line.who === "hamroh" ? "Hamroh" : user?.first_name}
                  </span>
                  {line.text}
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={!connected}
              aria-pressed={holding}
              onPointerDown={startHolding}
              onPointerUp={stopHolding}
              onPointerCancel={stopHolding}
              className={`btn w-full select-none border transition disabled:opacity-50 ${
                holding
                  ? "border-teal bg-teal/15 text-teal shadow-glow"
                  : "border-edge bg-panel/70 text-paper"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {holding && (
                  <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-teal" />
                )}
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${holding ? "bg-teal" : "bg-muted"}`} />
              </span>
              {t("session.hold")}
            </button>

            <p className="mt-2 text-center text-[11px] text-muted">{t("session.hold.hint")}</p>

            <div className="mt-3 flex gap-2">
              <input
                className="field py-2 text-sm"
                placeholder={t("session.type")}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendTyped()}
                disabled={!connected}
              />
              <button type="button" className="btn-ghost px-4 py-2 text-xs" onClick={sendTyped} disabled={!connected}>
                {t("session.send")}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-3 rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-xs text-coral"
              >
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  className="shrink-0 font-semibold uppercase tracking-wide text-coral/70 transition hover:text-coral"
                  onClick={() => setError(null)}
                >
                  {t("session.dismiss")}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="min-h-0 overflow-y-auto px-6 py-6">
          <h2 className="mb-4 font-display text-sm font-extrabold uppercase tracking-wide text-muted">
            {t("session.panel")}
          </h2>

          {panel.length === 0 ? (
            <div className="surface grid h-48 place-items-center p-6 text-center text-sm text-muted">
              {t("session.panel.empty")}
            </div>
          ) : (
            <div className="space-y-4">
              {panel.map((entry) => (
                <PanelCard key={entry.callId} entry={entry} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
