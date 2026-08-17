import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SessionOrmEntity } from "./infrastructure/typeorm/session.orm-entity";
import { SessionMessageOrmEntity } from "./infrastructure/typeorm/session-message.orm-entity";
import { SessionService } from "./application/services/session.service";
import { SessionFocusService } from "./application/services/session-focus.service";
import { ToolsService } from "./application/services/tools.service";
import { SessionGateway } from "./presentation/session.gateway";
import { AgentModule } from "../agent/agent.module";
import { SpeechModule } from "../speech/speech.module";
import { EducationModule } from "../education/education.module";
import { IdentityModule } from "../identity/identity.module";
import { QuizModule } from "../quiz/quiz.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionOrmEntity, SessionMessageOrmEntity]),
    AgentModule,
    SpeechModule,
    EducationModule,
    IdentityModule,
    QuizModule,
  ],
  providers: [SessionService, SessionFocusService, ToolsService, SessionGateway],
  exports: [SessionService],
})
export class SessionModule {}
