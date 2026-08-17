export type SessionState = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING";

export interface FocusHeadline {
  kind: "LESSON" | "QUIZ";
  title: string;
  subject: string;
  group_name: string;
  teacher_name: string;
  detail: string;
}

export interface SessionLine {
  id: number;
  who: "student" | "hamroh";
  text: string;
}
