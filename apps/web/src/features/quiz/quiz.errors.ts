import type { TranslationKey } from "../../i18n/dictionary";

const CODE_KEYS: Record<string, TranslationKey> = {
  NOT_GROUP_MEMBER: "quiz.notMember",
  QUIZ_NO_QUESTIONS: "quiz.noQuestions",
  QUIZ_NOT_READY: "quiz.notReady",
  TOO_MANY_ATTEMPTS: "quiz.tooMany",
  QUIZ_ENDED: "quiz.ended",
  QUIZ_NOT_FOUND: "error.unknown",
  INVALID_PIN: "error.unknown",
};

export function quizErrorKey(code: string | null): TranslationKey | null {
  if (!code) return null;
  return CODE_KEYS[code] ?? "error.unknown";
}
