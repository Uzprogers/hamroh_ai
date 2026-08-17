import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toolCardType, type PanelEntry } from "./PanelCard";
import { SIMLI_API_KEY } from "./avatar.const";
import type { AudioRoute, AvatarHandle, AvatarStatus } from "./avatar.types";
import type {
  ExerciseResult,
  FocusHeadline,
  FocusRequest,
  SessionLine,
  SessionPhase,
  SessionState,
} from "./session.types";
import { MicRecorder, PcmPlayer } from "../../lib/audio";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import type { PanelCard as PanelCardData } from "../../lib/types";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:3001";

export function useSession(request: FocusRequest) {
  const { token } = useAuth();
  const { t } = useI18n();

  const socketRef = useRef<Socket | null>(null);
  const playerRef = useRef(new PcmPlayer());
  const micRef = useRef(new MicRecorder());
  const avatarRef = useRef<AvatarHandle>(null);
  const routeRef = useRef<AudioRoute>("player");
  const readyRef = useRef<(() => void) | null>(null);
  const settledRef = useRef(false);
  const phaseRef = useRef<SessionPhase>("idle");
  const lineId = useRef(0);

  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<SessionState>("IDLE");
  const [lines, setLines] = useState<SessionLine[]>([]);
  const [panel, setPanel] = useState<PanelEntry[]>([]);
  const [results, setResults] = useState<Record<string, ExerciseResult>>({});
  const [focus, setFocus] = useState<FocusHeadline | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>("off");
  const [level, setLevel] = useState(0);
  const [holding, setHolding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarEnabled = Boolean(SIMLI_API_KEY);

  const lessonId = request.lesson_id;
  const quizId = request.quiz_session_id;
  const start = useMemo(
    () => ({ lesson_id: lessonId, quiz_session_id: quizId }),
    [lessonId, quizId],
  );

  useEffect(() => {
    const timer = setInterval(() => setLevel(playerRef.current.level()), 60);
    return () => clearInterval(timer);
  }, []);

  const addLine = useCallback((who: SessionLine["who"], text: string) => {
    lineId.current += 1;
    setLines((prev) => [...prev, { id: lineId.current, who, text }]);
  }, []);

  const routeAudio = useCallback((pcm: ArrayBuffer) => {
    if (routeRef.current === "avatar") avatarRef.current?.push(pcm);
    else playerRef.current.enqueue(pcm);
  }, []);

  const settle = useCallback((route: AudioRoute) => {
    settledRef.current = true;
    routeRef.current = route;
    readyRef.current?.();
    readyRef.current = null;
  }, []);

  const onAvatarStatus = useCallback(
    (next: AvatarStatus) => {
      setAvatarStatus(next);
      if (next === "live") settle("avatar");
      if (next === "failed") settle("player");
    },
    [settle],
  );

  const connect = useCallback(async () => {
    if (socketRef.current || phaseRef.current !== "idle") return;
    setError(null);
    await playerRef.current.resume();

    if (avatarEnabled && !settledRef.current) {
      phaseRef.current = "avatar";
      setPhase("avatar");
      await new Promise<void>((resolve) => {
        readyRef.current = resolve;
      });
      if (phaseRef.current !== "avatar") return;
    }

    phaseRef.current = "live";
    setPhase("live");

    const socket = io(`${WS_URL}/session`, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("session:start", start);
    });
    socket.on("session:ready", ({ focus: headline }: { focus: FocusHeadline | null }) =>
      setFocus(headline),
    );
    socket.on("state", ({ state: next }: { state: SessionState }) => setState(next));
    socket.on("transcript", ({ text }: { text: string }) => addLine("student", text));
    socket.on("reply", ({ text }: { text: string }) => addLine("hamroh", text));
    socket.on("audio", (pcm: ArrayBuffer) => routeAudio(pcm));

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

    socket.on("exercise:result", (result: ExerciseResult) =>
      setResults((prev) => ({ ...prev, [result.call_id]: result })),
    );

    socket.on("session:error", ({ message }: { message: string }) => setError(message));
    socket.on("disconnect", () => {
      setConnected(false);
      setState("IDLE");
    });
  }, [token, addLine, start, avatarEnabled, routeAudio]);

  const disconnect = useCallback(() => {
    socketRef.current?.emit("session:end");
    socketRef.current?.disconnect();
    socketRef.current = null;
    micRef.current.stop();
    avatarRef.current?.clear();
    phaseRef.current = "idle";
    readyRef.current?.();
    readyRef.current = null;
    setPhase("idle");
    setConnected(false);
    setHolding(false);
    setState("IDLE");
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  const building = state === "BUILDING";
  const checking = state === "CHECKING";

  const startHolding = useCallback(async () => {
    if (!connected || holding || building) return;
    try {
      setHolding(true);
      await micRef.current.start((pcm) => socketRef.current?.emit("audio:chunk", pcm));
    } catch {
      setHolding(false);
      setError(t("session.micDenied"));
    }
  }, [connected, holding, building, t]);

  const stopHolding = useCallback(() => {
    if (!holding) return;
    micRef.current.stop();
    setHolding(false);
    socketRef.current?.emit("audio:end");
  }, [holding]);

  const sendText = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean || !connected) return;
      socketRef.current?.emit("text", { text: clean });
    },
    [connected],
  );

  const submitExercise = useCallback((callId: string, answers: string[]) => {
    socketRef.current?.emit("exercise:answer", { call_id: callId, answers });
  }, []);

  return {
    phase,
    connected,
    state,
    building,
    checking,
    lines,
    panel,
    results,
    focus,
    error,
    level,
    holding,
    avatarRef,
    avatarStatus,
    avatarEnabled,
    onAvatarStatus,
    connect,
    disconnect,
    startHolding,
    stopHolding,
    sendText,
    submitExercise,
  };
}

export type SessionApi = ReturnType<typeof useSession>;
