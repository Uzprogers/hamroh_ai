export enum QuizStatus {
  LOBBY = "LOBBY",
  RUNNING = "RUNNING",
  ENDED = "ENDED",
}

export enum QuizEvent {
  JOIN = "quiz:join",
  NEXT = "quiz:next",
  ANSWER = "quiz:answer",
  FINISH = "quiz:finish",
  STATE = "quiz:state",
  ANSWERED = "quiz:answered",
  DISTRIBUTION = "quiz:distribution",
  REVEAL = "quiz:reveal",
  RESULT = "quiz:result",
  LEADERBOARD = "quiz:leaderboard",
  ENDED = "quiz:ended",
  ERROR = "quiz:error",
}

export enum QuizErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  NOT_GROUP_MEMBER = "NOT_GROUP_MEMBER",
  QUIZ_NOT_FOUND = "QUIZ_NOT_FOUND",
  INVALID_PIN = "INVALID_PIN",
  FORBIDDEN = "FORBIDDEN",
  QUIZ_ENDED = "QUIZ_ENDED",
  JOIN_FAILED = "JOIN_FAILED",
}

export const QUIZ_OPTION_COUNT = 4;
export const QUIZ_DEFAULT_SECONDS = 20;
export const QUIZ_MIN_SECONDS = 10;
export const QUIZ_MAX_SECONDS = 60;
export const QUIZ_MAX_SCORE = 1000;
export const QUIZ_SPEED_WEIGHT = 0.5;
export const QUIZ_PIN_LENGTH = 6;
export const QUIZ_PIN_ATTEMPTS = 20;
export const QUIZ_ANSWER_GRACE_MS = 400;
