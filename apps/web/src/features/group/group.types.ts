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

export interface GroupLessonSummary {
  id: string;
  topic: string;
  created_at: string;
  submissions: number;
}

export interface GroupMistakeCase {
  student_name: string;
  topic: string;
  fragment: string;
  correction: string;
  explanation: string;
  severity: string;
  date: string;
}

export interface GroupMistakeTally {
  label: string;
  count: number;
  items?: GroupMistakeCase[];
}

export interface GroupAnalytics {
  group: GroupAnalyticsGroup;
  average_percent: number;
  submissions: number;
  students: GroupStudentAnalytics[];
  growth_leaders: GroupGrowthLeader[];
  top_mistakes: GroupMistakeTally[];
  lessons?: GroupLessonSummary[];
  filtered_lesson_id?: string | null;
}

export interface StudentTimelinePoint {
  lesson_id: string;
  topic: string;
  date: string;
  percent: number;
}

export interface StudentCriterion {
  name: string;
  average_percent: number;
}

export interface StudentMistake {
  fragment: string;
  correction: string;
  explanation: string;
  severity: string;
  topic: string;
  date: string;
}

export interface StudentSeverityCounts {
  major: number;
  minor: number;
}

export interface GroupStudentDetail {
  student: { id: string; name: string };
  average_percent: number;
  submissions: number;
  growth_percent: number | null;
  timeline?: StudentTimelinePoint[];
  criteria?: StudentCriterion[];
  severity_counts?: StudentSeverityCounts;
  mistakes?: StudentMistake[];
}
