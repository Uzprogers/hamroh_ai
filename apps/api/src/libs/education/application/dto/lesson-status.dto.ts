import { IsEnum } from "class-validator";
import { LessonStatus } from "../../config/education.enums";

export class LessonStatusDto {
  @IsEnum(LessonStatus)
  status: LessonStatus;
}
