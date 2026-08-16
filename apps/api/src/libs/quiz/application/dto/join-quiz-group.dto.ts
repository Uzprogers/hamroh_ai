import { Matches } from "class-validator";

export class JoinQuizGroupDto {
  @Matches(/^\d{6}$/)
  pin: string;
}
