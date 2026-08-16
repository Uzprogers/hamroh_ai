import { MemberSource } from "../../config/education.enums";

export interface StudentGroupRow {
  id: string;
  name: string;
  subject: string;
  grade_level: number | null;
  teacher_name: string;
  member_count: number;
}

export interface GroupMemberRow {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  grade_level: string | null;
  source: MemberSource;
  joined_at: Date;
}
