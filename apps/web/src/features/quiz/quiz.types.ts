export type QuizStatus = "LOBBY" | "RUNNING" | "ENDED";

export type QuizGeneration = "PENDING" | "READY" | "FAILED";

export interface QuizSummary {
  id: string;
  pin: string;
  status: QuizStatus;
  lesson_topic: string;
  questions_count: number;
  generation: QuizGeneration;
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
