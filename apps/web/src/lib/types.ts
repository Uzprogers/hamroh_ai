import type { Locale } from "../i18n/dictionary";

export type Role = "TEACHER" | "STUDENT";
export type InstitutionType = "SCHOOL" | "UNIVERSITY" | "TUTORING";
export type LessonStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type AssignmentType = "WRITTEN" | "QUIZ" | "SPEAKING";
export type Severity = "MINOR" | "MAJOR";

export type AuthProvider = "LOCAL" | "GOOGLE" | "TELEGRAM";
export type TelegramLoginStatus = "PENDING" | "APPROVED" | "EXPIRED";

export interface User {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  auth_provider: AuthProvider;
  role: Role | null;
  institution_type: InstitutionType | null;
  institution_name: string | null;
  grade_level: string | null;
  subject: string | null;
  profile_completed: boolean;
  locale: Locale;
}

export interface TelegramSession {
  code: string;
  deep_link: string;
  bot_username: string;
  expires_at: string;
}

export interface TelegramSessionStatus {
  status: TelegramLoginStatus;
  auth: AuthResult | null;
}

export interface AuthResult {
  token: string;
  user: User;
}

export type ProfileMetricKey =
  | "GROUPS"
  | "STUDENTS"
  | "LESSONS"
  | "GRADED"
  | "MAJOR_MISTAKES"
  | "SUBMISSIONS"
  | "MISTAKES"
  | "SUBJECTS";

export interface MetricValue {
  key: ProfileMetricKey;
  value: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface BreakdownItem {
  label: string;
  average_percent: number;
  submissions: number;
}

export interface HighlightItem {
  label: string;
  caption: string;
  percent: number;
}

export interface ProfileStats {
  role: Role;
  average_percent: number;
  metrics: MetricValue[];
  trend: TrendPoint[];
  breakdown: BreakdownItem[];
  highlights: HighlightItem[];
}

export interface Group {
  id: string;
  teacher_id: string;
  name: string;
  subject: string;
  institution_type: InstitutionType;
  member_count?: number;
}

export interface PlanStep {
  title: string;
  description: string;
  minutes: number;
}

export interface Lesson {
  id: string;
  group_id: string;
  topic: string;
  objective: string | null;
  plan: PlanStep[];
  status: LessonStatus;
  created_at: string;
}

export interface Criterion {
  name: string;
  weight: number;
  description: string;
}

export interface Assignment {
  id: string;
  lesson_id: string;
  type: AssignmentType;
  question: string;
  criteria: Criterion[];
  max_score: number;
  order_index: number;
}

export interface Mistake {
  fragment: string;
  correction: string;
  explanation: string;
  severity: Severity;
}

export interface CriterionResult {
  name: string;
  score: number;
  max: number;
  comment: string;
}

export interface Grade {
  id: string;
  submission_id: string;
  score: string;
  max_score: number;
  feedback: string;
  mistakes: Mistake[];
  criteria_results: CriterionResult[];
  teacher_approved: boolean;
}

export interface StudentResult {
  submission_id: string;
  lesson_topic: string;
  subject: string;
  assignment_id: string;
  question: string;
  type: AssignmentType;
  answer: string | null;
  score: number | null;
  max_score: number;
  feedback: string | null;
  mistakes: Mistake[];
  criteria_results: CriterionResult[];
  teacher_approved: boolean;
  submitted_at: string;
}

export interface GroupSummaryRow {
  student_id: string;
  first_name: string;
  last_name: string;
  submissions: number;
  average_percent: number;
  major_mistakes: number;
}

export type PanelCardType =
  | "RESULTS"
  | "MISTAKES"
  | "EXERCISE"
  | "SPEAKING_REVIEW"
  | "STUDY_PLAN";

export interface PanelCard {
  type: PanelCardType;
  payload: unknown;
}

export interface ResultsPayload {
  average_percent: number;
  items: StudentResult[];
}

export interface MistakesPayload {
  total: number;
  items: (Mistake & { subject: string; topic: string })[];
}

export interface ExercisePayload {
  title: string;
  instruction: string;
  items: { prompt: string; answer: string; hint: string }[];
}

export interface SpeakingPayload {
  original: string;
  corrected: string;
  score: number;
  segments: { fragment: string; correct: boolean; correction: string; note: string }[];
}

export interface StudyPlanPayload {
  days: { day: number; focus: string; task: string; minutes: number }[];
}
