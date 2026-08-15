import { IsEnum, IsString, Length } from "class-validator";
import { InstitutionType } from "../../../identity/config/identity.enums";

export class CreateGroupDto {
  @IsString()
  @Length(1, 60)
  name: string;

  @IsString()
  @Length(2, 60)
  subject: string;

  @IsEnum(InstitutionType)
  institution_type: InstitutionType;
}
