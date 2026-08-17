import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { MicRecorder, PcmPlayer } from "../../lib/audio";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import { toolCardType, type PanelEntry } from "./PanelCard";
import type { PanelCard as PanelCardData } from "../../lib/types";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:3001";

const LEVEL_INTERVAL_MS = 60;
const TICK_INTERVAL_MS = 1000;

export type SessionState = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING";

export interface Line {
  id: number;
  who: "student" | "hamroh";
  text: string;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
  );
}

/**
 * Jonli sessiyaning transport qatlami: socket ulanishi, mikrofon va audio o'ynatish.
 * Sahifa faqat shu hook qaytargan holatni ko'rsatadi.
 */
export function useVoiceSession() {
  const { token } = useAuth();
  const { t } = useI18n();

  const socketRef = useRef<Socket | null>(null);
  const playerRef = useRef(new PcmPlayer());
  const micRef = useRef(new MicRecorder());
  const lineId = useRef(0);
  const holdingRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [state, setState] = useState<SessionState>("IDLE");
  const [lines, setLines] = useState<Line[]>([]);
  const [panel, setPanel] = useState<PanelEntry[]>([]);
  const [level, setLevel] = useState(0);
  const [holding, setHolding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected) {
      setLevel(0);
      return;
    }
    const timer = setInterval(() => setLevel(playerRef.current.level()), LEVEL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [connected]);

  useEffect(() => {
    if (!connected) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [connected]);

  const addLine = useCallback((who: Line["who"], text: string) => {
    lineId.current += 1;
    setLines((prev) => [...prev, { id: lineId.current, who, text }]);
  }, []);

  const connect = useCallback(async () => {
    if (socketRef.current || connecting) return;
    setConnecting(true);
    setError(null);
    await playerRef.current.resume();

    const socket = io(`${WS_URL}/session`, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnecting(false);
      setConnected(true);
      socket.emit("session:start", {});
    });

    socket.on("connect_error", () => {
      setConnecting(false);
      setError(t("session.connectFailed"));
      socket.disconnect();
      socketRef.current = null;
    });
    socket.on("state", ({ state: next }: { state: SessionState }) => setState(next));
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
  }, [token, addLine, connecting, t]);

  const disconnect = useCallback(() => {
    socketRef.current?.emit("session:end");
    socketRef.current?.disconnect();
    socketRef.current = null;
    micRef.current.stop();
    holdingRef.current = false;
    setConnecting(false);
    setConnected(false);
    setHolding(false);
    setState("IDLE");
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  const startHolding = useCallback(async () => {
    if (!connected || holdingRef.current) return;
    try {
      holdingRef.current = true;
      setHolding(true);
      await micRef.current.start((pcm) => socketRef.current?.emit("audio:chunk", pcm));
    } catch {
      holdingRef.current = false;
      setHolding(false);
      setError(t("session.micDenied"));
    }
  }, [connected, t]);

  // Bir marta qo'yib yuborilishga bitta "audio:end" — tugma va global hodisa ikki marta chaqirmasin
  const stopHolding = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    micRef.current.stop();
    setHolding(false);
    socketRef.current?.emit("audio:end");
  }, []);

  // Bo'sh joy (Space) tugmasi — mikrofonni bosib turishning klaviatura varianti
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || isTypingTarget(event.target)) return;
      event.preventDefault();
      void startHolding();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isTypingTarget(event.target)) return;
      event.preventDefault();
      stopHolding();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [startHolding, stopHolding]);

  // Tugmadan tashqarida qo'yib yuborilsa yoki oyna fokusni yo'qotsa mikrofon ochiq qolmasin
  useEffect(() => {
    if (!holding) return;
    window.addEventListener("pointerup", stopHolding);
    window.addEventListener("blur", stopHolding);
    return () => {
      window.removeEventListener("pointerup", stopHolding);
      window.removeEventListener("blur", stopHolding);
    };
  }, [holding, stopHolding]);

  /** Matn yuborildimi — sahifa shunga qarab kiritish maydonini tozalaydi. */
  const sendText = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || !connected) return false;
      socketRef.current?.emit("text", { text });
      return true;
    },
    [connected],
  );

  return {
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
  };
}
