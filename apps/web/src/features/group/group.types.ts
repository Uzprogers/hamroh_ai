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

export interface GroupMistakeTally {
  label: string;
  count: number;
}

export interface GroupAnalytics {
  group: GroupAnalyticsGroup;
  average_percent: number;
  submissions: number;
  students: GroupStudentAnalytics[];
  growth_leaders: GroupGrowthLeader[];
  top_mistakes: GroupMistakeTally[];
}
