import { Injectable, Logger } from "@nestjs/common";
import { LlmService, ToolDefinition } from "../../../agent/infrastructure/llm.service";
import { ResultsService } from "../../../education/application/services/results.service";
import { PanelCardType } from "../../config/session.enums";
import { ExercisePayload, ExerciseVerdict } from "../types/exercise.types";
import { Locale } from "../../../../core/i18n/locale.enum";
import { LANGUAGE_INSTRUCTION } from "../../../../core/i18n/prompt-language";

export interface ToolOutcome {
  summary: string;
  card: { type: PanelCardType; payload: unknown };
}

export interface ToolContext {
  studentId: string;
  locale: Locale;
  subject: string;
  topic: string;
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
    name: "explain_topic",
    description:
      "Teach the topic again from the start, in small steps with examples. Call it when the student's drill went badly and they agreed to hear it again.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The topic to teach again" },
        weak_points: {
          type: "array",
          items: { type: "string" },
          description: "What the student keeps getting wrong",
        },
      },
      required: ["topic"],
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
      case "explain_topic":
        return this.explainTopic(
          ctx,
          String(args.topic ?? ""),
          Array.isArray(args.weak_points) ? args.weak_points.map(String) : [],
        );
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
When the subject is a foreign language, the student must answer IN THAT LANGUAGE: write the task in
their speaking language, say inside the prompt text which language the answer must be in, and write
the expected answer in the target language.
${LANGUAGE_INSTRUCTION[ctx.locale]}`,
      `Subject: ${ctx.subject || "not set"}\nLesson: ${ctx.topic || topic}\nDrill topic: ${topic}\nDifficulty: ${difficulty}`,
    );

    return {
      summary: JSON.stringify({ title: generated.title, item_count: generated.items?.length ?? 0 }),
      card: { type: PanelCardType.EXERCISE, payload: generated },
    };
  }

  private async explainTopic(
    ctx: ToolContext,
    topic: string,
    weakPoints: string[],
  ): Promise<ToolOutcome> {
    const generated = await this.ai.json<{
      title: string;
      summary: string;
      steps: { title: string; text: string; example: string }[];
      check: string;
    }>(
      `You re-teach one topic to a student who just failed a drill on it. Return JSON only:
{"title": "...", "summary": "two sentences", "steps": [{"title": "...", "text": "...", "example": "..."}], "check": "one question that proves they got it"}
Exactly 3 steps, each with a concrete example the student can copy.
${LANGUAGE_INSTRUCTION[ctx.locale]}`,
      `Topic: ${topic}\nKeeps getting wrong: ${weakPoints.join(", ") || "unknown"}`,
    );

    return {
      summary: JSON.stringify({ title: generated.title, step_count: generated.steps?.length ?? 0 }),
      card: { type: PanelCardType.TOPIC_RECAP, payload: generated },
    };
  }

  async gradeExercise(
    exercise: ExercisePayload,
    answers: string[],
    locale: Locale,
  ): Promise<ExerciseVerdict[]> {
    const graded = await this.ai.json<{
      items: { index: number; correct: boolean; comment: string }[];
    }>(
      `You mark a student's answers to a short drill. Return JSON only:
{"items": [{"index": 0, "correct": true, "comment": "one short sentence"}]}
One entry per task, in order. Accept any wording that carries the same meaning as the expected
answer; mark wrong only when the content is wrong. The comment says what was wrong and what the
correct form is, never praise.
${LANGUAGE_INSTRUCTION[locale]}`,
      exercise.items
        .map(
          (item, index) =>
            `${index}. Task: ${item.prompt}\n   Expected: ${item.answer}\n   Student: ${answers[index]?.trim() || "(no answer)"}`,
        )
        .join("\n"),
    );

    const byIndex = new Map((graded.items ?? []).map((item) => [Number(item.index), item]));

    return exercise.items.map((item, index) => {
      const verdict = byIndex.get(index);
      return {
        index,
        correct: Boolean(verdict?.correct) && Boolean(answers[index]?.trim()),
        expected: item.answer,
        comment: verdict?.comment ?? "",
      };
    });
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
