import { AssignmentType, ErrorSeverity } from "../src/libs/education/config/education.enums";

export interface PlanStepFixture {
  title: string;
  description: string;
  minutes: number;
}

export interface CriterionFixture {
  name: string;
  weight: number;
  description: string;
}

export interface AssignmentFixture {
  type: AssignmentType;
  question: string;
  expected_answer: string;
  criteria: CriterionFixture[];
}

export interface MistakeFixture {
  fragment: string;
  correction: string;
  explanation: string;
  severity: ErrorSeverity;
}

export interface QuizQuestionFixture {
  text: string;
  options: string[];
  correct_index: number;
  seconds: number;
}

export interface LessonFixture {
  topic: string;
  objective: string;
  plan: PlanStepFixture[];
  assignments: AssignmentFixture[];
  mistakes: MistakeFixture[];
  quiz: QuizQuestionFixture[];
}

export interface StudentFixture {
  first_name: string;
  last_name: string;
  phone: string;
}

export interface GroupFixture {
  subject: string;
  lessons: LessonFixture[];
}

export interface ClassFixture {
  name: string;
  grade_level: number;
  students: StudentFixture[];
  groups: GroupFixture[];
}

export interface TeacherFixture {
  first_name: string;
  last_name: string;
  phone: string;
  subject: string;
}

export interface SchoolFixture {
  school: string;
  teacher: TeacherFixture;
  classes: ClassFixture[];
}
