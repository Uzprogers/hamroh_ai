import { IsString, Length } from "class-validator";

export class JoinClassDto {
  @IsString()
  @Length(2, 160)
  school: string;

  @IsString()
  @Length(1, 40)
  class_name: string;
}
