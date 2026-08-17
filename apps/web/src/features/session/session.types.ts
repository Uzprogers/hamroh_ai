export type SessionState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "BUILDING"
  | "CHECKING";

export interface FocusHeadline {
  kind: "LESSON" | "QUIZ";
  title: string;
  subject: string;
  group_name: string;
  teacher_name: string;
  detail: string;
}

export interface SessionLine {
  id: number;
  who: "student" | "hamroh";
  text: string;
}

export interface FocusRequest {
  lesson_id?: string;
  quiz_session_id?: string;
}

export interface ExerciseVerdict {
  index: number;
  correct: boolean;
  expected: string;
  comment: string;
}

export interface ExerciseResult {
  call_id: string;
  title: string;
  total: number;
  correct: number;
  percent: number;
  items: ExerciseVerdict[];
}

export interface TopicRecapPayload {
  title: string;
  summary: string;
  steps: { title: string; text: string; example: string }[];
  check: string;
}
