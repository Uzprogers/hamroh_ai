import { InstitutionType } from "../../../identity/config/identity.enums";

export interface SchoolClassRow {
  name: string;
  grade_level: number;
  subjects: string[];
  student_count: number;
}

export interface SchoolRow {
  name: string;
  institution_type: InstitutionType;
  classes: SchoolClassRow[];
}
