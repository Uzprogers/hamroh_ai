import { IsString, IsUUID, Length } from "class-validator";

export class SubmitAnswerDto {
  @IsUUID()
  assignment_id: string;

  @IsString()
  @Length(1, 5000)
  text: string;
}
