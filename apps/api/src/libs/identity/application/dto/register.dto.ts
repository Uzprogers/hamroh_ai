import { IsEnum, IsOptional, IsString, Length, Matches } from "class-validator";
import { InstitutionType, Role } from "../../config/identity.enums";
import { Locale } from "../../../../core/i18n/locale.enum";

export class RegisterDto {
  @IsString()
  @Length(2, 60)
  first_name: string;

  @IsString()
  @Length(2, 60)
  last_name: string;

  @Matches(/^\+998\d{9}$/)
  phone: string;

  @IsString()
  @Length(6, 72)
  password: string;

  @IsEnum(Role)
  role: Role;

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
  @IsEnum(Locale)
  locale?: Locale;
}
