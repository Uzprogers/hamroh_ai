import { ArrayMaxSize, ArrayNotEmpty, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { LESSON_GROUPS_MAX } from "../../config/education.enums";

export class CreateLessonDto {
  @IsUUID("all", { each: true })
  @ArrayNotEmpty()
  @ArrayMaxSize(LESSON_GROUPS_MAX)
  group_ids: string[];

  @IsString()
  @Length(3, 200)
  topic: string;

  @IsOptional()
  @IsString()
  @Length(1, 600)
  note?: string;
}
