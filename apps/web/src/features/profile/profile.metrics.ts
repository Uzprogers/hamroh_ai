import type { TranslationKey } from "../../i18n/dictionary";
import type { ProfileMetricKey } from "../../lib/types";

export const METRIC_LABEL: Record<ProfileMetricKey, TranslationKey> = {
  GROUPS: "profile.metric.groups",
  STUDENTS: "profile.metric.students",
  LESSONS: "profile.metric.lessons",
  GRADED: "profile.metric.graded",
  MAJOR_MISTAKES: "profile.metric.major",
  SUBMISSIONS: "profile.metric.submissions",
  MISTAKES: "profile.metric.mistakes",
  SUBJECTS: "profile.metric.subjects",
};

export const METRIC_ACCENT: Record<ProfileMetricKey, string> = {
  GROUPS: "from-teal to-azure",
  STUDENTS: "from-azure to-teal",
  LESSONS: "from-teal to-amber",
  GRADED: "from-azure to-coral",
  MAJOR_MISTAKES: "from-coral to-amber",
  SUBMISSIONS: "from-teal to-azure",
  MISTAKES: "from-coral to-amber",
  SUBJECTS: "from-amber to-teal",
};
