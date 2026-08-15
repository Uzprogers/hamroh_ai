import { IsEnum, IsOptional } from "class-validator";
import { Locale } from "../../../../core/i18n/locale.enum";

export class TelegramSessionDto {
  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;
}
