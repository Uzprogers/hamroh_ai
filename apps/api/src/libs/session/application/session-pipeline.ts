import { Logger } from "@nestjs/common";
import { ChatMessage, LlmService } from "../../agent/infrastructure/llm.service";
import { YandexSttService } from "../../speech/infrastructure/yandex-stt.service";
import { YandexTtsService } from "../../speech/infrastructure/yandex-tts.service";
import { ToolsService } from "./services/tools.service";
import { SentenceBuffer } from "./sentence-buffer";
import { buildSessionPrompt, openingInstruction, StudentContext } from "./session-prompt";
import { SessionFocus } from "./types/session-focus.types";
import { splitSpeech } from "../../speech/application/speech-segments";
import { speechLocaleOf } from "../config/subject-locale";
import { Locale } from "../../../core/i18n/locale.enum";
import { ExercisePayload, ExerciseResult } from "./types/exercise.types";
import {
  BUILDING_TOOLS,
  MessageSender,
  PanelCardType,
  SessionState,
} from "../config/session.enums";

const MAX_TOOL_ROUNDS = 3;
const PCM_BYTES_PER_SECOND = 32000;
const TURN_WAIT_MS = 30000;

export interface PipelineEvents {
  state: (state: SessionState) => void;
  transcript: (text: string) => void;
  reply: (text: string) => void;
  audio: (pcm: Buffer) => void;
  toolPending: (callId: string, tool: string) => void;
  toolReady: (callId: string, tool: string, card: unknown) => void;
  exerciseResult: (result: ExerciseResult) => void;
  failure: (message: string) => void;
  persist: (sender: MessageSender, text: string | null, toolName?: string, toolResult?: unknown) => void;
}

export class SessionPipeline {
  private readonly logger = new Logger(SessionPipeline.name);
  private readonly history: ChatMessage[] = [];
  private readonly systemPrompt: string;
  private readonly exercises = new Map<string, ExercisePayload>();
  private readonly speechLocale: Locale | null;
  private audioChunks: Buffer[] = [];
  private queued: string | null = null;
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
    this.speechLocale = speechLocaleOf(focus?.subject ?? "");
  }

  feedAudio(chunk: Buffer): void {
    if (this.disposed) return;
    this.audioChunks.push(chunk);
  }

  async endAudio(): Promise<void> {
    if (this.disposed) return;

    const audio = Buffer.concat(this.audioChunks);
    this.audioChunks = [];
    if (audio.length < PCM_BYTES_PER_SECOND / 4) return;

    if (!this.busy) this.events.state(SessionState.THINKING);
    try {
      const text = await this.deps.stt.recognize(audio, this.student.locale);
      if (!text.trim()) {
        if (!this.busy) this.events.state(SessionState.LISTENING);
        return;
      }
      await this.handleText(text);
    } catch (err) {
      this.fail(err);
    }
  }

  async handleText(text: string): Promise<void> {
    if (this.disposed || !text.trim()) return;
    this.events.transcript(text);
    this.events.persist(MessageSender.STUDENT, text);

    if (this.busy) {
      this.queued = text;
      return;
    }
    await this.runTurn(text);
  }

  async openingTurn(): Promise<void> {
    if (this.disposed || this.busy) return;
    await this.runTurn(openingInstruction(this.focus));
  }

  async submitExercise(callId: string, answers: string[]): Promise<void> {
    const exercise = this.exercises.get(callId);
    if (this.disposed || !exercise) return;
    await this.waitIdle();
    if (this.disposed || this.busy) return;

    this.events.state(SessionState.CHECKING);
    try {
      const items = await this.deps.tools.gradeExercise(exercise, answers, this.student.locale);
      const correct = items.filter((item) => item.correct).length;
      const result: ExerciseResult = {
        call_id: callId,
        title: exercise.title,
        total: items.length,
        correct,
        percent: items.length ? Math.round((correct / items.length) * 100) : 0,
        items,
      };

      this.events.exerciseResult(result);
      this.events.persist(MessageSender.TOOL, null, "grade_exercise", result);
      await this.runTurn(this.exerciseReport(exercise, result));
    } catch (err) {
      this.fail(err);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.audioChunks = [];
    this.queued = null;
    this.exercises.clear();
  }

  private exerciseReport(exercise: ExercisePayload, result: ExerciseResult): string {
    const wrong = result.items
      .filter((item) => !item.correct)
      .map((item) => `"${exercise.items[item.index]?.prompt}" (correct: ${item.expected})`)
      .join("; ");

    return `[SYSTEM] The student finished the drill "${result.title}": ${result.correct} of ${result.total} correct (${result.percent}%). Wrong: ${wrong || "none"}. React to this result now.`;
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

    await this.drain();
  }

  private async drain(): Promise<void> {
    if (this.disposed || this.busy || !this.queued) return;
    const next = this.queued;
    this.queued = null;
    await this.runTurn(next);
  }

  private async waitIdle(): Promise<void> {
    const deadline = Date.now() + TURN_WAIT_MS;
    while (this.busy && !this.disposed && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 150));
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
      if (BUILDING_TOOLS.includes(call.name)) this.events.state(SessionState.BUILDING);
      try {
        const outcome = await this.deps.tools.execute(call.name, call.args, {
          studentId: this.student.id,
          locale: this.student.locale,
          subject: this.focus?.subject ?? "",
          topic: this.focus?.topic ?? "",
        });
        if (outcome.card.type === PanelCardType.EXERCISE) {
          this.exercises.set(call.id, outcome.card.payload as ExercisePayload);
        }
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
      const segments = splitSpeech(sentence, this.student.locale, this.speechLocale);

      let bytes = 0;
      for (const segment of segments) {
        const pcm = await this.deps.tts.synthesize(segment.text, segment.locale, "pcm");
        if (this.disposed) return bytes;
        this.events.audio(pcm);
        bytes += pcm.length;
      }
      return bytes;
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
