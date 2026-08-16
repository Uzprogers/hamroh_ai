import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuizSessionOrmEntity } from "./infrastructure/typeorm/quiz-session.orm-entity";
import { QuizAnswerOrmEntity } from "./infrastructure/typeorm/quiz-answer.orm-entity";
import { QuizService } from "./application/services/quiz.service";
import { QuizGateway } from "./infrastructure/quiz.gateway";
import { QuizController } from "./presentation/quiz.controller";
import { AgentModule } from "../agent/agent.module";
import { EducationModule } from "../education/education.module";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizSessionOrmEntity, QuizAnswerOrmEntity]),
    AgentModule,
    EducationModule,
    IdentityModule,
  ],
  controllers: [QuizController],
  providers: [QuizService, QuizGateway],
  exports: [QuizService],
})
export class QuizModule {}
