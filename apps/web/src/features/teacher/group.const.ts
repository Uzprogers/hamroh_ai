import type { TranslationKey } from "../../i18n/dictionary";
import type { InstitutionType } from "../../lib/types";

export interface GroupNaming {
  nameLabel: TranslationKey;
  namePlaceholder: string;
  nameHint: TranslationKey;
  nameInvalid: TranslationKey | null;
  levelLabel: TranslationKey | null;
  levelHint: TranslationKey | null;
  levels: number[];
  deriveLevel: boolean;
}

const SCHOOL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const UNIVERSITY_COURSES = [1, 2, 3, 4, 5, 6];

export const GROUP_NAMING: Record<InstitutionType, GroupNaming> = {
  SCHOOL: {
    nameLabel: "teacher.className",
    namePlaceholder: "9-A",
    nameHint: "teacher.className.hint",
    nameInvalid: "teacher.className.invalid",
    levelLabel: "teacher.grade",
    levelHint: "teacher.grade.hint",
    levels: SCHOOL_GRADES,
    deriveLevel: true,
  },
  UNIVERSITY: {
    nameLabel: "teacher.groupName",
    namePlaceholder: "201-guruh",
    nameHint: "teacher.groupName.hint",
    nameInvalid: null,
    levelLabel: "teacher.course",
    levelHint: "teacher.course.hint",
    levels: UNIVERSITY_COURSES,
    deriveLevel: false,
  },
  TUTORING: {
    nameLabel: "teacher.groupName",
    namePlaceholder: "IELTS 7.0",
    nameHint: "teacher.groupName.tutoring",
    nameInvalid: null,
    levelLabel: null,
    levelHint: null,
    levels: [],
    deriveLevel: false,
  },
};

export function gradeFromName(name: string, levels: number[]): number | null {
  const match = name.trim().match(/^(\d{1,2})/);
  if (!match) return null;
  const grade = Number(match[1]);
  return levels.includes(grade) ? grade : null;
}
