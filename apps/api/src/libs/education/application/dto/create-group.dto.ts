import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { InstitutionType } from "../../../identity/config/identity.enums";
import { GRADE_LEVEL_MAX, GRADE_LEVEL_MIN } from "../../config/education.enums";

export class CreateGroupDto {
  @IsString()
  @Length(1, 60)
  name: string;

  @IsString()
  @Length(2, 60)
  subject: string;

  @IsOptional()
  @IsInt()
  @Min(GRADE_LEVEL_MIN)
  @Max(GRADE_LEVEL_MAX)
  grade_level?: number;

  @IsEnum(InstitutionType)
  institution_type: InstitutionType;
}
