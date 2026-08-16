import { MemberSource } from "../../config/education.enums";

export interface SchoolGroupRow {
  id: string;
  name: string;
  subject: string;
  teacher_name: string;
  member_count: number;
  is_member: boolean;
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
