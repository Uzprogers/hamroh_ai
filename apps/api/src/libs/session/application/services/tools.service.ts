import { Injectable, Logger } from "@nestjs/common";
import { LlmService, ToolDefinition } from "../../../agent/infrastructure/llm.service";
import { ResultsService } from "../../../education/application/services/results.service";
import { PanelCardType } from "../../config/session.enums";
import { Locale } from "../../../../core/i18n/locale.enum";
import { LANGUAGE_INSTRUCTION } from "../../../../core/i18n/prompt-language";

export interface ToolOutcome {
  summary: string;
  card: { type: PanelCardType; payload: unknown };
}

export interface ToolContext {
  studentId: string;
  locale: Locale;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "get_results",
    description:
      "Fetch the student's most recent graded work. Call this before discussing performance so the numbers are real.",
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Optional subject filter" },
      },
    },
  },
  {
    name: "get_mistakes",
    description:
      "Fetch the concrete mistakes the student made in recent graded work, with corrections.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "create_exercise",
    description:
      "Build a short practice exercise targeting a weakness. Use it right after naming a mistake.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", description: "What the exercise drills" },
        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
      },
      required: ["topic"],
    },
  },
  {
    name: "review_speaking",
    description:
      "Check a sentence the student just said out loud and return corrections fragment by fragment.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Exactly what the student said" },
      },
      required: ["text"],
    },
  },
  {
    name: "study_plan",
    description: "Draft a short day-by-day study plan built from the student's actual weak points.",
    parameters: {
      type: "object",
      properties: {
        days: { type: "integer", minimum: 3, maximum: 14 },
      },
    },
  },
];

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);

  constructor(
    private readonly resultsService: ResultsService,
    private readonly ai: LlmService,
  ) {}

  get definitions(): ToolDefinition[] {
    return TOOL_DEFINITIONS;
  }

  async execute(
    name: string,
    args: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<ToolOutcome> {
    switch (name) {
      case "get_results":
        return this.getResults(ctx, args.subject as string | undefined);
      case "get_mistakes":
        return this.getMistakes(ctx);
      case "create_exercise":
        return this.createExercise(ctx, String(args.topic ?? ""), String(args.difficulty ?? "medium"));
      case "review_speaking":
        return this.reviewSpeaking(ctx, String(args.text ?? ""));
      case "study_plan":
        return this.studyPlan(ctx, Number(args.days ?? 7));
      default:
        this.logger.warn(`Unknown tool requested: ${name}`);
        return {
          summary: "This tool does not exist.",
          card: { type: PanelCardType.RESULTS, payload: null },
        };
    }
  }

  private async getResults(ctx: ToolContext, subject?: string): Promise<ToolOutcome> {
    const all = await this.resultsService.studentResults(ctx.studentId, 12);
    const rows = subject
      ? all.filter((r) => r.subject.toLowerCase().includes(subject.toLowerCase()))
      : all;

    const graded = rows.filter((r) => r.score !== null);
    const average = graded.length
      ? Math.round(
          (graded.reduce((sum, r) => sum + (r.score ?? 0) / r.max_score, 0) / graded.length) * 100,
        )
      : 0;

    return {
      summary: JSON.stringify({
        count: rows.length,
        average_percent: average,
        items: rows.slice(0, 5).map((r) => ({
          subject: r.subject,
          topic: r.lesson_topic,
          type: r.type,
          score: r.score,
          max: r.max_score,
          feedback: r.feedback,
        })),
      }),
      card: {
        type: PanelCardType.RESULTS,
        payload: { average_percent: average, items: rows.slice(0, 6) },
      },
    };
  }

  private async getMistakes(ctx: ToolContext): Promise<ToolOutcome> {
    const rows = await this.resultsService.studentResults(ctx.studentId, 12);
    const mistakes = rows.flatMap((r) =>
      r.mistakes.map((m) => ({ ...m, subject: r.subject, topic: r.lesson_topic })),
    );

    return {
      summary: JSON.stringify({
        total: mistakes.length,
        items: mistakes.slice(0, 6),
      }),
      card: {
        type: PanelCardType.MISTAKES,
        payload: { total: mistakes.length, items: mistakes.slice(0, 8) },
      },
    };
  }

  private async createExercise(
    ctx: ToolContext,
    topic: string,
    difficulty: string,
  ): Promise<ToolOutcome> {
    const generated = await this.ai.json<{
      title: string;
      instruction: string;
      items: { prompt: string; answer: string; hint: string }[];
    }>(
      `You design short drills for one student. Return JSON only:
{"title": "...", "instruction": "one sentence", "items": [{"prompt": "...", "answer": "...", "hint": "..."}]}
Exactly 4 items, each solvable in under a minute.
${LANGUAGE_INSTRUCTION[ctx.locale]}`,
      `Topic: ${topic}\nDifficulty: ${difficulty}`,
    );

    return {
      summary: JSON.stringify({ title: generated.title, item_count: generated.items?.length ?? 0 }),
      card: { type: PanelCardType.EXERCISE, payload: generated },
    };
  }

  private async reviewSpeaking(ctx: ToolContext, text: string): Promise<ToolOutcome> {
    const generated = await this.ai.json<{
      corrected: string;
      segments: { fragment: string; correct: boolean; correction: string; note: string }[];
      score: number;
    }>(
      `You review one spoken sentence. Return JSON only:
{"corrected": "the fixed sentence", "segments": [{"fragment": "...", "correct": true, "correction": "", "note": ""}], "score": 0-100}
Split the sentence into its natural fragments and mark each one. Never invent errors.
${LANGUAGE_INSTRUCTION[ctx.locale]}`,
      `Student said: ${text}`,
    );

    return {
      summary: JSON.stringify({
        score: generated.score,
        errors: generated.segments?.filter((s) => !s.correct).length ?? 0,
      }),
      card: { type: PanelCardType.SPEAKING_REVIEW, payload: { original: text, ...generated } },
    };
  }

  private async studyPlan(ctx: ToolContext, days: number): Promise<ToolOutcome> {
    const rows = await this.resultsService.studentResults(ctx.studentId, 10);
    const weakSpots = rows
      .flatMap((r) => r.criteria_results.filter((c) => c.score < c.max).map((c) => c.name))
      .slice(0, 8);

    const generated = await this.ai.json<{
      days: { day: number; focus: string; task: string; minutes: number }[];
    }>(
      `You draft a study plan. Return JSON only:
{"days": [{"day": 1, "focus": "...", "task": "...", "minutes": 20}]}
Each day gets one focus and one concrete task, 15-30 minutes.
${LANGUAGE_INSTRUCTION[ctx.locale]}`,
      `Days: ${Math.min(Math.max(days, 3), 14)}\nWeak criteria: ${weakSpots.join(", ") || "unknown"}`,
    );

    return {
      summary: JSON.stringify({ day_count: generated.days?.length ?? 0 }),
      card: { type: PanelCardType.STUDY_PLAN, payload: generated },
    };
  }
}
