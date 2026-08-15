import { IsString, Length, Matches } from "class-validator";

export class LoginDto {
  @Matches(/^\+998\d{9}$/)
  phone: string;

  @IsString()
  @Length(6, 72)
  password: string;
}
