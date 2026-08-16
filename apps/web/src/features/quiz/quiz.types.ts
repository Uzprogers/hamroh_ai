export type QuizStatus = "LOBBY" | "RUNNING" | "ENDED";

export type QuizGeneration = "PENDING" | "READY" | "FAILED";

export interface QuizSummary {
  id: string;
  pin: string;
  status: QuizStatus;
  lesson_topic: string;
  questions_count: number;
  generation: QuizGeneration;
  is_member: boolean;
  group_name: string;
  subject: string;
  teacher_name: string;
  school: string;
}

export interface QuizPlayer {
  id: string;
  name: string;
  score: number;
  correct: number;
}

export interface PublicQuestion {
  text: string;
  options: string[];
  seconds: number;
}

export interface QuizState {
  status: QuizStatus;
  index: number;
  total: number;
  question: PublicQuestion | null;
  deadline: number;
  players: QuizPlayer[];
}

export interface AnswerOutcome {
  correct: boolean;
  score: number;
  correct_index: number;
}

export interface RevealPayload {
  index: number;
  correct_index: number;
  counts: number[];
}

export interface DistributionPayload {
  index: number;
  counts: number[];
  answered: number;
  total: number;
}

export interface AnsweredPayload {
  answered: number;
  total: number;
}

export interface LeaderboardRow {
  student_id: string;
  name: string;
  score: number;
  correct: number;
  total: number;
  avg_ms: number;
}

export interface QuestionStat {
  index: number;
  text: string;
  correct_index: number;
  correct_count: number;
  wrong_count: number;
  avg_ms: number;
}

export interface QuizResults {
  leaderboard: LeaderboardRow[];
  questions: QuestionStat[];
}

export interface QuizAttempt {
  session_id: string;
  pin: string;
  lesson_topic: string;
  group_name: string;
  subject: string;
  status: QuizStatus;
  played_at: string;
  score: number;
  correct: number;
  answered: number;
  total: number;
  rank: number;
  players: number;
  avg_ms: number;
}

export interface QuizAnswerReview {
  index: number;
  text: string;
  options: string[];
  correct_index: number;
  chosen_index: number | null;
  correct: boolean;
  elapsed_ms: number;
  score: number;
  seconds: number;
  class_correct_percent: number;
}

export interface QuizReport {
  attempt: QuizAttempt;
  answers: QuizAnswerReview[];
}
