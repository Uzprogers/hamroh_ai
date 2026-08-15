import { Matches } from "class-validator";

export class AddMemberDto {
  @Matches(/^\+998\d{9}$/)
  phone: string;
}
