import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { Orb } from "../../components/Orb";
import { PanelCard, toolCardType, type PanelEntry } from "./PanelCard";
import { MicRecorder, PcmPlayer } from "../../lib/audio";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import { Logo } from "../../components/Logo";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { ThemeToggle } from "../../components/ThemeToggle";
import type { PanelCard as PanelCardData } from "../../lib/types";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:3001";

type State = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING";

interface Line {
  id: number;
  who: "student" | "hamroh";
  text: string;
}

export function SessionPage() {
  const { token, user } = useAuth();
  const { t } = useI18n();

  const socketRef = useRef<Socket | null>(null);
  const playerRef = useRef(new PcmPlayer());
  const micRef = useRef(new MicRecorder());
  const lineId = useRef(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<State>("IDLE");
  const [lines, setLines] = useState<Line[]>([]);
  const [panel, setPanel] = useState<PanelEntry[]>([]);
  const [level, setLevel] = useState(0);
  const [holding, setHolding] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setLevel(playerRef.current.level()), 60);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const addLine = useCallback((who: Line["who"], text: string) => {
    lineId.current += 1;
    setLines((prev) => [...prev, { id: lineId.current, who, text }]);
  }, []);

  const connect = useCallback(async () => {
    if (socketRef.current) return;
    await playerRef.current.resume();

    const socket = io(`${WS_URL}/session`, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("session:start", {});
    });
    socket.on("state", ({ state: next }: { state: State }) => setState(next));
    socket.on("transcript", ({ text }: { text: string }) => addLine("student", text));
    socket.on("reply", ({ text }: { text: string }) => addLine("hamroh", text));
    socket.on("audio", (pcm: ArrayBuffer) => playerRef.current.enqueue(pcm));

    socket.on("panel:pending", ({ call_id, tool }: { call_id: string; tool: string }) => {
      setPanel((prev) => [
        { callId: call_id, tool, type: toolCardType(tool), payload: null },
        ...prev,
      ]);
    });

    socket.on(
      "panel:ready",
      ({ call_id, tool, card }: { call_id: string; tool: string; card: PanelCardData }) => {
        setPanel((prev) =>
          prev.map((entry) =>
            entry.callId === call_id
              ? { ...entry, type: card?.type ?? toolCardType(tool), payload: card?.payload ?? null }
              : entry,
          ),
        );
      },
    );

    socket.on("session:error", ({ message }: { message: string }) => setError(message));
    socket.on("disconnect", () => {
      setConnected(false);
      setState("IDLE");
    });
  }, [token, addLine]);

  const disconnect = useCallback(() => {
    socketRef.current?.emit("session:end");
    socketRef.current?.disconnect();
    socketRef.current = null;
    micRef.current.stop();
    setConnected(false);
    setState("IDLE");
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  const startHolding = async () => {
    if (!connected || holding) return;
    try {
      setHolding(true);
      await micRef.current.start((pcm) => socketRef.current?.emit("audio:chunk", pcm));
    } catch {
      setHolding(false);
      setError(t("session.micDenied"));
    }
  };

  const stopHolding = () => {
    if (!holding) return;
    micRef.current.stop();
    setHolding(false);
    socketRef.current?.emit("audio:end");
  };

  const sendTyped = () => {
    const text = typed.trim();
    if (!text || !connected) return;
    socketRef.current?.emit("text", { text });
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
          <ThemeToggle />
          <LanguageSwitcher />
          {connected ? (
            <button type="button" className="chip hover:border-coral/50 hover:text-coral" onClick={disconnect}>
              {t("session.end")}
            </button>
          ) : (
            <button type="button" className="btn-primary px-4 py-2" onClick={connect}>
              {t("session.connect")}
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
              onPointerDown={startHolding}
              onPointerUp={stopHolding}
              onPointerLeave={stopHolding}
              className={`btn w-full select-none border transition ${
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

            {error && <p className="mt-3 text-xs text-coral">{error}</p>}
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
