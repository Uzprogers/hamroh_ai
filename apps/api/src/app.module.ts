import { Module } from "@nestjs/common";
import { DatabaseModule } from "./core/database/database.module";
import { IdentityModule } from "./libs/identity/identity.module";
import { AgentModule } from "./libs/agent/agent.module";
import { SpeechModule } from "./libs/speech/speech.module";
import { EducationModule } from "./libs/education/education.module";
import { QuizModule } from "./libs/quiz/quiz.module";
import { SessionModule } from "./libs/session/session.module";

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    AgentModule,
    SpeechModule,
    EducationModule,
    SessionModule,
    QuizModule,
  ],
})
export class AppModule {}
