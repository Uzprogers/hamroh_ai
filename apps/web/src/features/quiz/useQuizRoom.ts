import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "../../lib/auth";
import type {
  AnswerOutcome,
  AnsweredPayload,
  DistributionPayload,
  QuizPlayer,
  QuizResults,
  QuizState,
  RevealPayload,
} from "./quiz.types";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:3001";
const EMPTY_COUNTS = [0, 0, 0, 0];

export interface QuizRoom {
  connected: boolean;
  state: QuizState | null;
  leaderboard: QuizPlayer[];
  answered: AnsweredPayload;
  counts: number[];
  reveal: RevealPayload | null;
  outcome: AnswerOutcome | null;
  chosen: number | null;
  results: QuizResults | null;
  errorCode: string | null;
  next: () => void;
  finish: () => void;
  answer: (optionIndex: number) => void;
}

export function useQuizRoom(pin: string | null): QuizRoom {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const indexRef = useRef(-1);

  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<QuizState | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuizPlayer[]>([]);
  const [answered, setAnswered] = useState<AnsweredPayload>({ answered: 0, total: 0 });
  const [counts, setCounts] = useState<number[]>(EMPTY_COUNTS);
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [outcome, setOutcome] = useState<AnswerOutcome | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (!pin || !token) return;

    const socket = io(`${WS_URL}/quiz`, { transports: ["websocket"] });
    socketRef.current = socket;
    indexRef.current = -1;

    socket.on("connect", () => {
      setConnected(true);
      setErrorCode(null);
      socket.emit("quiz:join", { pin, token });
    });

    socket.on("quiz:state", (payload: QuizState) => {
      setState(payload);
      if (payload.status === "RUNNING" && payload.index !== indexRef.current) {
        indexRef.current = payload.index;
        setReveal(null);
        setOutcome(null);
        setChosen(null);
        setCounts(EMPTY_COUNTS);
        setAnswered({ answered: 0, total: payload.players.length });
      }
    });

    socket.on("quiz:leaderboard", ({ rows }: { rows: QuizPlayer[] }) => setLeaderboard(rows));
    socket.on("quiz:answered", (payload: AnsweredPayload) => setAnswered(payload));
    socket.on("quiz:distribution", (payload: DistributionPayload) => {
      setCounts(payload.counts);
      setAnswered({ answered: payload.answered, total: payload.total });
    });
    socket.on("quiz:reveal", (payload: RevealPayload) => {
      setReveal(payload);
      setCounts(payload.counts);
    });
    socket.on("quiz:result", (payload: AnswerOutcome) => setOutcome(payload));
    socket.on("quiz:ended", ({ results: payload }: { results: QuizResults }) => {
      setResults(payload);
      setState((prev) => (prev ? { ...prev, status: "ENDED", question: null } : prev));
    });
    socket.on("quiz:error", ({ code }: { code: string }) => setErrorCode(code));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [pin, token]);

  const next = useCallback(() => socketRef.current?.emit("quiz:next"), []);
  const finish = useCallback(() => socketRef.current?.emit("quiz:finish"), []);

  const answer = useCallback(
    (optionIndex: number) => {
      if (chosen !== null) return;
      setChosen(optionIndex);
      socketRef.current?.emit("quiz:answer", { option_index: optionIndex });
    },
    [chosen],
  );

  return {
    connected,
    state,
    leaderboard,
    answered,
    counts,
    reveal,
    outcome,
    chosen,
    results,
    errorCode,
    next,
    finish,
    answer,
  };
}
