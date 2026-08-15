import { IsOptional, IsString, IsUUID, Length } from "class-validator";

export class CreateLessonDto {
  @IsUUID()
  group_id: string;

  @IsString()
  @Length(3, 200)
  topic: string;

  @IsOptional()
  @IsString()
  @Length(1, 600)
  note?: string;
}
