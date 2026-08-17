import { useEffect, useRef, useState } from "react";
import { HologramAvatar } from "./HologramAvatar";
import { SimliAvatar } from "./SimliAvatar";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import type { SessionApi } from "./useSession";

export function SessionConsole({ session }: { session: SessionApi }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [session.lines]);

  const send = () => {
    session.sendText(typed);
    setTyped("");
  };

  const stateLabel = {
    IDLE: t("session.idle"),
    LISTENING: t("session.listening"),
    THINKING: t("session.thinking"),
    SPEAKING: t("session.speaking"),
    BUILDING: t("session.building"),
    CHECKING: t("session.checking"),
  }[session.state];

  const warming = session.phase === "avatar";
  const avatarLive = session.avatarStatus === "live";
  const showAvatar = session.avatarEnabled && session.avatarStatus !== "failed";
  const avatarFailed = session.avatarEnabled && session.connected && session.avatarStatus === "failed";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-[300px] flex-1 overflow-hidden bg-[#04070F]">
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            avatarLive ? "opacity-0" : "opacity-100"
          }`}
        >
          <HologramAvatar level={session.level} state={session.state} />
        </div>

        {showAvatar && (
          <div className="absolute inset-0">
            <SimliAvatar
              ref={session.avatarRef}
              active={session.avatarEnabled}
              speaking={session.state === "SPEAKING"}
              onStatus={session.onAvatarStatus}
            />
          </div>
        )}

        <span className="chip absolute left-4 top-4 backdrop-blur">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              session.state === "SPEAKING"
                ? "bg-teal"
                : session.state === "BUILDING" || session.state === "CHECKING"
                  ? "bg-azure animate-pulse"
                  : session.state === "THINKING"
                    ? "bg-amber"
                    : "bg-muted"
            }`}
          />
          {stateLabel}
        </span>

        {avatarFailed && !session.building && !session.checking && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-edge bg-panel/70 px-4 py-2.5 backdrop-blur">
            <p className="text-start text-xs text-muted">{t("session.avatar.failed")}</p>
          </div>
        )}

        {(session.building || session.checking) && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-azure/40 bg-ink/70 px-4 py-3 backdrop-blur">
            <p className="text-start text-sm font-semibold text-azure">
              {t(session.building ? "session.building.hint" : "session.checking.hint")}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-5 pt-4 sm:px-5">
        <div
          ref={transcriptRef}
          className="mb-4 max-h-36 space-y-2 overflow-y-auto pr-1"
          aria-live="polite"
        >
          {session.lines.map((line) => (
            <div
              key={line.id}
              className={`animate-rise text-start text-sm ${
                line.who === "hamroh" ? "text-paper" : "text-muted"
              }`}
            >
              <span className="me-2 font-mono text-[10px] uppercase tracking-wide text-teal">
                {line.who === "hamroh" ? "Hamroh" : user?.first_name}
              </span>
              {line.text}
            </div>
          ))}
        </div>

        {session.connected ? (
          <>
            <button
              type="button"
              disabled={session.building}
              onPointerDown={session.startHolding}
              onPointerUp={session.stopHolding}
              onPointerLeave={session.stopHolding}
              className={`btn w-full select-none border transition disabled:opacity-50 ${
                session.holding
                  ? "border-teal bg-teal/15 text-teal shadow-glow"
                  : "border-edge bg-panel/70 text-paper"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {session.holding && (
                  <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-teal" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    session.holding ? "bg-teal" : "bg-muted"
                  }`}
                />
              </span>
              {session.building ? t("session.building.mic") : t("session.hold")}
            </button>

            <div className="mt-3 flex gap-2">
              <input
                className="field py-2 text-sm"
                placeholder={t("session.type")}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && send()}
                disabled={session.building}
              />
              <button
                type="button"
                className="btn-ghost px-4 py-2 text-xs"
                onClick={send}
                disabled={session.building}
              >
                {t("session.send")}
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="btn-primary w-full disabled:opacity-60"
            disabled={warming}
            onClick={session.connect}
          >
            {warming && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
            )}
            {t(warming ? "session.avatar.warming" : "session.connect")}
          </button>
        )}

        {session.error && <p className="mt-3 text-start text-xs text-coral">{session.error}</p>}
      </div>
    </div>
  );
}
