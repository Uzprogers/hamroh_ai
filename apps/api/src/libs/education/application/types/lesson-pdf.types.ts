import { AssignmentOrmEntity } from "../../infrastructure/typeorm/assignment.orm-entity";
import { GroupOrmEntity } from "../../infrastructure/typeorm/group.orm-entity";
import { LessonOrmEntity } from "../../infrastructure/typeorm/lesson.orm-entity";

export interface LessonSheetSource {
  lesson: LessonOrmEntity;
  group: GroupOrmEntity;
  assignments: AssignmentOrmEntity[];
}

export interface LessonPdfFile {
  filename: string;
  document: NodeJS.ReadableStream;
}
