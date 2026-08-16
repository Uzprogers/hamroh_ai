import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { env } from "../../../core/config/env.config";

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface JsonOptions {
  fast?: boolean;
}

export type StreamChunk =
  | { kind: "text"; text: string }
  | { kind: "tool"; id: string; name: string; args: Record<string, unknown> };

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client = new OpenAI({ apiKey: env.llm.apiKey, baseURL: env.llm.baseUrl });

  get model(): string {
    return env.llm.model;
  }

  async json<T>(systemPrompt: string, userPrompt: string, options: JsonOptions = {}): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: env.llm.model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      ...(options.fast ? { reasoning_effort: "none" } : {}),
    } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

    const raw = response.choices[0]?.message?.content ?? "{}";
    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.error(`Model returned non-JSON: ${raw.slice(0, 200)}`);
      throw new Error("AI_INVALID_JSON");
    }
  }

  async *stream(
    systemPrompt: string,
    messages: ChatMessage[],
    tools: ToolDefinition[] = [],
    maxTokens = 400,
  ): AsyncIterable<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: env.llm.model,
      temperature: 0.4,
      max_tokens: maxTokens,
      stream: true,
      tools: tools.length ? tools.map((t) => this.toToolParam(t)) : undefined,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => this.toMessageParam(m)),
      ],
    });

    const pending = new Map<number, { id: string; name: string; args: string }>();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) yield { kind: "text", text: delta.content };

      for (const call of delta.tool_calls ?? []) {
        const prev = pending.get(call.index) ?? { id: "", name: "", args: "" };
        pending.set(call.index, {
          id: call.id ?? prev.id,
          name: call.function?.name ?? prev.name,
          args: prev.args + (call.function?.arguments ?? ""),
        });
      }
    }

    for (const call of pending.values()) {
      if (!call.name) continue;
      yield { kind: "tool", id: call.id, name: call.name, args: this.parseArgs(call.args) };
    }
  }

  private parseArgs(raw: string): Record<string, unknown> {
    if (!raw.trim()) return {};
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      this.logger.warn(`Unparsable tool arguments: ${raw.slice(0, 120)}`);
      return {};
    }
  }

  private toToolParam(t: ToolDefinition): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters as OpenAI.FunctionParameters,
      },
    };
  }

  private toMessageParam(m: ChatMessage): OpenAI.Chat.Completions.ChatCompletionMessageParam {
    if (m.role === "tool") {
      return { role: "tool", content: m.content, tool_call_id: m.tool_call_id ?? "" };
    }
    if (m.role === "assistant" && m.tool_calls?.length) {
      return { role: "assistant", content: m.content || null, tool_calls: m.tool_calls };
    }
    return { role: m.role, content: m.content } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
  }
}
