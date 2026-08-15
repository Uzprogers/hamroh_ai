import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Locale } from "../../../../core/i18n/locale.enum";

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;
}
