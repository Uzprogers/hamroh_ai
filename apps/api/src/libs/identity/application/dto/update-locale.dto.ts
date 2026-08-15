import { IsEnum } from "class-validator";
import { Locale } from "../../../../core/i18n/locale.enum";

export class UpdateLocaleDto {
  @IsEnum(Locale)
  locale: Locale;
}
