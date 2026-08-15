import { Module } from "@nestjs/common";
import { LlmService } from "./infrastructure/llm.service";

@Module({
  providers: [LlmService],
  exports: [LlmService],
})
export class AgentModule {}
