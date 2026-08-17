import { SessionFocusKind } from "../../config/session.enums";

export interface FocusRequest {
  lesson_id?: string;
  quiz_session_id?: string;
}

export interface FocusMistake {
  fragment: string;
  correction: string;
  explanation: string;
}

export interface FocusWork {
  question: string;
  answer: string | null;
  score: number | null;
  max_score: number;
  feedback: string | null;
  mistakes: FocusMistake[];
}

export interface FocusMiss {
  question: string;
  chosen: string | null;
  correct: string;
}

export interface LessonFocus {
  kind: SessionFocusKind.LESSON;
  id: string;
  topic: string;
  objective: string;
  subject: string;
  group_name: string;
  teacher_name: string;
  plan: string[];
  work: FocusWork[];
}

export interface QuizFocus {
  kind: SessionFocusKind.QUIZ;
  id: string;
  pin: string;
  topic: string;
  subject: string;
  group_name: string;
  teacher_name: string;
  score: number;
  correct: number;
  total: number;
  rank: number;
  players: number;
  misses: FocusMiss[];
}

export type SessionFocus = LessonFocus | QuizFocus;

export interface FocusHeadline {
  kind: SessionFocusKind;
  title: string;
  subject: string;
  group_name: string;
  teacher_name: string;
  detail: string;
}
