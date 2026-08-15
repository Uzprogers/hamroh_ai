import { IsEnum, IsOptional, IsString, Length, Matches } from "class-validator";
import { InstitutionType, Role } from "../../config/identity.enums";
import { Locale } from "../../../../core/i18n/locale.enum";

export class CompleteProfileDto {
  @IsEnum(Role)
  role: Role;

  @IsString()
  @Length(2, 60)
  first_name: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  last_name?: string;

  @IsEnum(InstitutionType)
  institution_type: InstitutionType;

  @IsString()
  @Length(2, 160)
  institution_name: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  grade_level?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  subject?: string;

  @IsOptional()
  @Matches(/^\+998\d{9}$/)
  phone?: string;

  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;
}
