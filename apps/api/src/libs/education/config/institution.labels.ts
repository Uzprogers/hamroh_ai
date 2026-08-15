import { InstitutionType } from "../../identity/config/identity.enums";

export const INSTITUTION_PROMPT_LABEL: Record<InstitutionType, string> = {
  [InstitutionType.SCHOOL]: "secondary school",
  [InstitutionType.UNIVERSITY]: "university",
  [InstitutionType.TUTORING]: "private tutoring centre",
};
