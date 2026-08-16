import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GroupOrmEntity } from "./infrastructure/typeorm/group.orm-entity";
import { GroupMemberOrmEntity } from "./infrastructure/typeorm/group-member.orm-entity";
import { LessonOrmEntity } from "./infrastructure/typeorm/lesson.orm-entity";
import { AssignmentOrmEntity } from "./infrastructure/typeorm/assignment.orm-entity";
import { SubmissionOrmEntity } from "./infrastructure/typeorm/submission.orm-entity";
import { GradeOrmEntity } from "./infrastructure/typeorm/grade.orm-entity";
import { UserOrmEntity } from "../identity/infrastructure/typeorm/user.orm-entity";
import { GroupService } from "./application/services/group.service";
import { LessonService } from "./application/services/lesson.service";
import { GradingService } from "./application/services/grading.service";
import { ResultsService } from "./application/services/results.service";
import { AnalyticsService } from "./application/services/analytics.service";
import { GroupAnalyticsService } from "./application/services/group-analytics.service";
import { GroupController } from "./presentation/group.controller";
import { LessonController } from "./presentation/lesson.controller";
import { SubmissionController } from "./presentation/submission.controller";
import { ProfileController } from "./presentation/profile.controller";
import { GroupAnalyticsController } from "./presentation/group-analytics.controller";
import { AgentModule } from "../agent/agent.module";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupOrmEntity,
      GroupMemberOrmEntity,
      LessonOrmEntity,
      AssignmentOrmEntity,
      SubmissionOrmEntity,
      GradeOrmEntity,
      UserOrmEntity,
    ]),
    AgentModule,
    IdentityModule,
  ],
  controllers: [
    GroupController,
    LessonController,
    SubmissionController,
    ProfileController,
    GroupAnalyticsController,
  ],
  providers: [
    GroupService,
    LessonService,
    GradingService,
    ResultsService,
    AnalyticsService,
    GroupAnalyticsService,
  ],
  exports: [GroupService, LessonService, GradingService, ResultsService, AnalyticsService, TypeOrmModule],
})
export class EducationModule {}
