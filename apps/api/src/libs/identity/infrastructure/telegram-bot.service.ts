import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { env } from "../../../core/config/env.config";
import { Locale } from "../../../core/i18n/locale.enum";
import { TELEGRAM_COPY, TelegramCopy } from "../config/telegram.messages";
import { TelegramAuthService } from "../application/services/telegram-auth.service";

interface TelegramContact {
  phone_number: string;
  user_id?: number;
  first_name?: string;
  last_name?: string;
}

interface TelegramMessage {
  chat: { id: number };
  from?: { id: number; first_name?: string; last_name?: string };
  text?: string;
  contact?: TelegramContact;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly waiting = new Map<number, string>();
  private offset = 0;
  private running = false;

  constructor(private readonly telegramAuth: TelegramAuthService) {}

  onModuleInit(): void {
    if (!this.telegramAuth.configured) {
      this.logger.warn("Telegram bot o'chirilgan: TELEGRAM_BOT_TOKEN yo'q");
      return;
    }
    this.running = true;
    void this.poll();
  }

  onModuleDestroy(): void {
    this.running = false;
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        const updates = await this.call<TelegramUpdate[]>("getUpdates", {
          offset: this.offset,
          timeout: 30,
          allowed_updates: ["message"],
        });

        for (const update of updates) {
          this.offset = update.update_id + 1;
          if (update.message) await this.handle(update.message);
        }
      } catch (error) {
        this.logger.error(`Telegram poll xatosi: ${(error as Error).message}`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  private async handle(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text?.trim() ?? "";
    const startCode = text.startsWith("/start") ? text.split(/\s+/)[1] : undefined;

    if (startCode) {
      await this.offerConfirm(chatId, startCode);
      return;
    }

    const code = this.waiting.get(chatId);
    if (!code) {
      await this.send(chatId, TELEGRAM_COPY[Locale.UZ].greeting);
      return;
    }

    const login = await this.telegramAuth.findPending(code);
    if (!login) {
      this.waiting.delete(chatId);
      await this.send(chatId, TELEGRAM_COPY[Locale.UZ].expired);
      return;
    }

    const copy = TELEGRAM_COPY[login.locale];

    if (!message.contact) {
      await this.askContact(chatId, copy, copy.needContact);
      return;
    }

    if (message.contact.user_id !== (message.from?.id ?? chatId)) {
      await this.askContact(chatId, copy, copy.foreignContact);
      return;
    }

    await this.telegramAuth.approve(login, {
      id: message.contact.user_id,
      first_name: message.contact.first_name ?? message.from?.first_name,
      last_name: message.contact.last_name ?? message.from?.last_name,
      phone_number: message.contact.phone_number,
    });

    this.waiting.delete(chatId);
    await this.send(chatId, copy.approved, { remove_keyboard: true });
  }

  private async offerConfirm(chatId: number, code: string): Promise<void> {
    const login = await this.telegramAuth.findPending(code);
    if (!login) {
      await this.send(chatId, TELEGRAM_COPY[Locale.UZ].expired);
      return;
    }

    this.waiting.set(chatId, code);
    const copy = TELEGRAM_COPY[login.locale];
    await this.askContact(chatId, copy, copy.askContact);
  }

  private async askContact(chatId: number, copy: TelegramCopy, text: string): Promise<void> {
    await this.send(chatId, text, {
      keyboard: [[{ text: copy.shareContact, request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    });
  }

  private async send(chatId: number, text: string, replyMarkup?: unknown): Promise<void> {
    await this.call("sendMessage", {
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    });
  }

  private async call<T>(method: string, payload: Record<string, unknown>): Promise<T> {
    const response = await fetch(`https://api.telegram.org/bot${env.telegram.botToken}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as { ok: boolean; result?: T; description?: string };
    if (!body.ok) throw new Error(body.description ?? method);
    return body.result as T;
  }
}
