import { IsUUID } from "class-validator";

export class CreateQuizSessionDto {
  @IsUUID()
  lesson_id: string;
}
