import { ErrorSeverity } from "../../config/education.enums";

export interface GroupAnalyticsGroup {
  id: string;
  name: string;
  subject: string;
}

export interface GroupStudentAnalytics {
  student_id: string;
  name: string;
  average_percent: number;
  submissions: number;
  growth_percent: number | null;
  major_mistakes: number;
}

export interface GroupGrowthLeader {
  student_id: string;
  name: string;
  growth_percent: number;
}

export interface GroupMistakeSample {
  student_name: string;
  topic: string;
  fragment: string;
  correction: string;
  explanation: string;
  severity: ErrorSeverity;
  date: Date;
}

export interface GroupMistakeTally {
  label: string;
  count: number;
  items: GroupMistakeSample[];
}

export interface GroupLessonSummary {
  id: string;
  topic: string;
  created_at: Date;
  submissions: number;
}

export interface GroupAnalytics {
  group: GroupAnalyticsGroup;
  average_percent: number;
  submissions: number;
  students: GroupStudentAnalytics[];
  growth_leaders: GroupGrowthLeader[];
  top_mistakes: GroupMistakeTally[];
  lessons: GroupLessonSummary[];
  filtered_lesson_id: string | null;
}

export interface StudentTimelinePoint {
  lesson_id: string;
  topic: string;
  date: Date;
  percent: number;
}

export interface StudentCriterionAverage {
  name: string;
  average_percent: number;
}

export interface StudentSeverityCounts {
  major: number;
  minor: number;
}

export interface StudentMistakeDetail {
  fragment: string;
  correction: string;
  explanation: string;
  severity: ErrorSeverity;
  topic: string;
  date: Date;
}

export interface StudentIdentity {
  id: string;
  name: string;
}

export interface StudentDetail {
  student: StudentIdentity;
  average_percent: number;
  submissions: number;
  growth_percent: number | null;
  timeline: StudentTimelinePoint[];
  criteria: StudentCriterionAverage[];
  severity_counts: StudentSeverityCounts;
  mistakes: StudentMistakeDetail[];
}
