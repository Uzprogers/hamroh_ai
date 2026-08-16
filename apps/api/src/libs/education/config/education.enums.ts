export enum LessonStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

export enum AssignmentType {
  WRITTEN = "WRITTEN",
  QUIZ = "QUIZ",
  SPEAKING = "SPEAKING",
}

export enum ErrorSeverity {
  MINOR = "MINOR",
  MAJOR = "MAJOR",
}

export enum MemberSource {
  TEACHER = "TEACHER",
  PIN = "PIN",
  CODE = "CODE",
  SCHOOL = "SCHOOL",
}

export const GROUP_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const GROUP_CODE_LENGTH = 6;
export const GROUP_CODE_ATTEMPTS = 20;

export const GRADE_LEVEL_MIN = 1;
export const GRADE_LEVEL_MAX = 16;
