import { Logger } from "@nestjs/common";
import { ChatMessage, LlmService } from "../../agent/infrastructure/llm.service";
import { YandexSttService } from "../../speech/infrastructure/yandex-stt.service";
import { YandexTtsService } from "../../speech/infrastructure/yandex-tts.service";
import { ToolsService } from "./services/tools.service";
import { SentenceBuffer } from "./sentence-buffer";
import { buildSessionPrompt, openingInstruction, StudentContext } from "./session-prompt";
import { SessionFocus } from "./types/session-focus.types";
import { MessageSender, SessionState } from "../config/session.enums";

const MAX_TOOL_ROUNDS = 3;
const PCM_BYTES_PER_SECOND = 32000;

export interface PipelineEvents {
  state: (state: SessionState) => void;
  transcript: (text: string) => void;
  reply: (text: string) => void;
  audio: (pcm: Buffer) => void;
  toolPending: (callId: string, tool: string) => void;
  toolReady: (callId: string, tool: string, card: unknown) => void;
  failure: (message: string) => void;
  persist: (sender: MessageSender, text: string | null, toolName?: string, toolResult?: unknown) => void;
}

export class SessionPipeline {
  private readonly logger = new Logger(SessionPipeline.name);
  private readonly history: ChatMessage[] = [];
  private readonly systemPrompt: string;
  private audioChunks: Buffer[] = [];
  private busy = false;
  private disposed = false;

  constructor(
    private readonly student: StudentContext & { id: string },
    private readonly focus: SessionFocus | null,
    private readonly deps: {
      stt: YandexSttService;
      tts: YandexTtsService;
      ai: LlmService;
      tools: ToolsService;
    },
    private readonly events: PipelineEvents,
  ) {
    this.systemPrompt = buildSessionPrompt(student, focus);
  }

  feedAudio(chunk: Buffer): void {
    if (this.disposed || this.busy) return;
    this.audioChunks.push(chunk);
  }

  async endAudio(): Promise<void> {
    if (this.disposed || this.busy) return;

    const audio = Buffer.concat(this.audioChunks);
    this.audioChunks = [];
    if (audio.length < PCM_BYTES_PER_SECOND / 4) return;

    this.events.state(SessionState.THINKING);
    try {
      const text = await this.deps.stt.recognize(audio, this.student.locale);
      if (!text.trim()) {
        this.events.state(SessionState.LISTENING);
        return;
      }
      this.events.transcript(text);
      this.events.persist(MessageSender.STUDENT, text);
      await this.runTurn(text);
    } catch (err) {
      this.fail(err);
    }
  }

  async handleText(text: string): Promise<void> {
    if (this.disposed || this.busy || !text.trim()) return;
    this.events.transcript(text);
    this.events.persist(MessageSender.STUDENT, text);
    await this.runTurn(text);
  }

  async openingTurn(): Promise<void> {
    if (this.disposed || this.busy) return;
    await this.runTurn(openingInstruction(this.focus));
  }

  dispose(): void {
    this.disposed = true;
    this.audioChunks = [];
  }

  private async runTurn(userText: string): Promise<void> {
    this.busy = true;
    this.history.push({ role: "user", content: userText });

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const spoken = await this.streamRound();
        if (!spoken.toolCalls.length) break;
        await this.runTools(spoken.toolCalls);
      }
    } catch (err) {
      this.fail(err);
    } finally {
      this.busy = false;
      if (!this.disposed) this.events.state(SessionState.LISTENING);
    }
  }

  private async streamRound(): Promise<{
    text: string;
    toolCalls: { id: string; name: string; args: Record<string, unknown> }[];
  }> {
    this.events.state(SessionState.THINKING);

    const speechQueue: Promise<number>[] = [];
    const buffer = new SentenceBuffer((sentence) => {
      speechQueue.push(this.speak(sentence));
    });

    let full = "";
    const toolCalls: { id: string; name: string; args: Record<string, unknown> }[] = [];

    for await (const chunk of this.deps.ai.stream(
      this.systemPrompt,
      this.history,
      this.deps.tools.definitions,
    )) {
      if (this.disposed) break;
      if (chunk.kind === "text") {
        full += chunk.text;
        buffer.push(chunk.text);
      } else {
        toolCalls.push({ id: chunk.id, name: chunk.name, args: chunk.args });
      }
    }

    buffer.flush();
    const bytes = await Promise.all(speechQueue);

    if (full.trim()) {
      this.events.reply(full.trim());
      this.events.persist(MessageSender.HAMROH, full.trim());
      this.history.push({
        role: "assistant",
        content: full.trim(),
        tool_calls: toolCalls.length
          ? toolCalls.map((c) => ({
              id: c.id,
              type: "function" as const,
              function: { name: c.name, arguments: JSON.stringify(c.args) },
            }))
          : undefined,
      });
    } else if (toolCalls.length) {
      this.history.push({
        role: "assistant",
        content: "",
        tool_calls: toolCalls.map((c) => ({
          id: c.id,
          type: "function" as const,
          function: { name: c.name, arguments: JSON.stringify(c.args) },
        })),
      });
    }

    await this.waitForPlayback(bytes.reduce((sum, n) => sum + n, 0));
    return { text: full, toolCalls };
  }

  private async runTools(
    calls: { id: string; name: string; args: Record<string, unknown> }[],
  ): Promise<void> {
    for (const call of calls) {
      this.events.toolPending(call.id, call.name);
      try {
        const outcome = await this.deps.tools.execute(call.name, call.args, {
          studentId: this.student.id,
          locale: this.student.locale,
        });
        this.events.toolReady(call.id, call.name, outcome.card);
        this.events.persist(MessageSender.TOOL, null, call.name, outcome.card);
        this.history.push({ role: "tool", content: outcome.summary, tool_call_id: call.id });
      } catch (err) {
        this.logger.error(`Tool ${call.name} failed: ${(err as Error).message}`);
        this.history.push({
          role: "tool",
          content: JSON.stringify({ error: "TOOL_FAILED" }),
          tool_call_id: call.id,
        });
      }
    }
  }

  private async speak(sentence: string): Promise<number> {
    if (this.disposed) return 0;
    try {
      this.events.state(SessionState.SPEAKING);
      const pcm = await this.deps.tts.synthesize(sentence, this.student.locale, "pcm");
      if (this.disposed) return 0;
      this.events.audio(pcm);
      return pcm.length;
    } catch (err) {
      this.logger.error(`TTS failed: ${(err as Error).message}`);
      return 0;
    }
  }

  private async waitForPlayback(totalBytes: number): Promise<void> {
    if (!totalBytes) return;
    const ms = (totalBytes / PCM_BYTES_PER_SECOND) * 1000 + 300;
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private fail(err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    this.logger.error(`Pipeline failure: ${message}`);
    this.events.failure(message);
    this.events.state(SessionState.LISTENING);
  }
}
