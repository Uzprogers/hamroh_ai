import { QuizGeneration, QuizStatus } from "../../config/quiz.enums";

export interface QuizQuestion {
  text: string;
  options: string[];
  correct_index: number;
  seconds: number;
}

export interface GeneratedQuiz {
  questions: QuizQuestion[];
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

export interface QuizStatePayload {
  status: QuizStatus;
  index: number;
  total: number;
  question: PublicQuestion | null;
  deadline: number;
  players: QuizPlayer[];
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

export interface QuizAccess {
  session_id: string;
  is_host: boolean;
  name: string;
}

export interface QuizSessionSummary {
  id: string;
  pin: string;
  status: QuizStatus;
  lesson_topic: string;
  questions_count: number;
  generation: QuizGeneration;
}

export interface QuizSummary extends QuizSessionSummary {
  is_member: boolean;
  group_name: string;
  subject: string;
  teacher_name: string;
  school: string;
}

export interface AnswerOutcome {
  correct: boolean;
  score: number;
  correct_index: number;
}

export interface QuizAttempt {
  session_id: string;
  pin: string;
  lesson_topic: string;
  group_name: string;
  subject: string;
  status: QuizStatus;
  played_at: Date;
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
