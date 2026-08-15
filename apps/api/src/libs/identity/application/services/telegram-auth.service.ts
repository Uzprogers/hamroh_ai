import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";
import { randomBytes } from "node:crypto";
import { env } from "../../../../core/config/env.config";
import { Locale } from "../../../../core/i18n/locale.enum";
import { AuthProvider, TelegramLoginStatus } from "../../config/identity.enums";
import { UserOrmEntity } from "../../infrastructure/typeorm/user.orm-entity";
import { TelegramLoginOrmEntity } from "../../infrastructure/typeorm/telegram-login.orm-entity";
import { AuthResult, AuthService } from "./auth.service";

export interface TelegramSession {
  code: string;
  deep_link: string;
  bot_username: string;
  expires_at: string;
}

export interface TelegramSessionStatus {
  status: TelegramLoginStatus;
  auth: AuthResult | null;
}

export interface TelegramIdentity {
  id: number;
  phone_number: string;
  first_name?: string;
  last_name?: string;
}

@Injectable()
export class TelegramAuthService {
  constructor(
    @InjectRepository(UserOrmEntity) private readonly userRepo: Repository<UserOrmEntity>,
    @InjectRepository(TelegramLoginOrmEntity)
    private readonly loginRepo: Repository<TelegramLoginOrmEntity>,
    private readonly authService: AuthService,
  ) {}

  get configured(): boolean {
    return Boolean(env.telegram.botToken && env.telegram.botUsername);
  }

  async start(locale: Locale): Promise<TelegramSession> {
    if (!this.configured) throw new ServiceUnavailableException("TELEGRAM_NOT_CONFIGURED");

    await this.loginRepo.delete({ expires_at: LessThan(new Date()) });

    const code = randomBytes(16).toString("hex");
    const expires_at = new Date(Date.now() + env.telegram.loginTtlMs);

    await this.loginRepo.save(this.loginRepo.create({ code, locale, expires_at }));

    return {
      code,
      bot_username: env.telegram.botUsername,
      deep_link: `https://t.me/${env.telegram.botUsername}?start=${code}`,
      expires_at: expires_at.toISOString(),
    };
  }

  async status(code: string): Promise<TelegramSessionStatus> {
    const login = await this.loginRepo.findOne({ where: { code } });
    if (!login) throw new NotFoundException("TELEGRAM_CODE_UNKNOWN");

    if (login.status !== TelegramLoginStatus.APPROVED && login.expires_at.getTime() < Date.now()) {
      return { status: TelegramLoginStatus.EXPIRED, auth: null };
    }

    if (login.status !== TelegramLoginStatus.APPROVED || !login.user_id) {
      return { status: TelegramLoginStatus.PENDING, auth: null };
    }

    const user = await this.authService.findOrFail(login.user_id);
    await this.loginRepo.delete({ id: login.id });

    return { status: TelegramLoginStatus.APPROVED, auth: this.authService.issue(user) };
  }

  async findPending(code: string): Promise<TelegramLoginOrmEntity | null> {
    const login = await this.loginRepo.findOne({ where: { code } });
    if (!login || login.status === TelegramLoginStatus.APPROVED) return null;
    return login.expires_at.getTime() < Date.now() ? null : login;
  }

  async approve(login: TelegramLoginOrmEntity, identity: TelegramIdentity): Promise<UserOrmEntity> {
    const user = await this.upsertUser(identity, login.locale);

    login.status = TelegramLoginStatus.APPROVED;
    login.user_id = user.id;
    await this.loginRepo.save(login);

    return user;
  }

  private async upsertUser(identity: TelegramIdentity, locale: Locale): Promise<UserOrmEntity> {
    const telegram_id = String(identity.id);
    const phone = this.normalizePhone(identity.phone_number);
    if (!phone) throw new BadRequestException("PHONE_REQUIRED");

    const existing =
      (await this.userRepo.findOne({ where: { telegram_id } })) ??
      (await this.userRepo.findOne({ where: { phone } }));

    if (existing) {
      existing.telegram_id = telegram_id;
      if (existing.phone !== phone) {
        const taken = await this.userRepo.findOne({ where: { phone } });
        if (!taken || taken.id === existing.id) existing.phone = phone;
      }
      return this.userRepo.save(existing);
    }

    return this.userRepo.save(
      this.userRepo.create({
        first_name: identity.first_name?.trim() || "Telegram",
        last_name: identity.last_name?.trim() || null,
        phone,
        telegram_id,
        auth_provider: AuthProvider.TELEGRAM,
        profile_completed: false,
        locale,
      }),
    );
  }

  private normalizePhone(raw: string): string | null {
    const digits = raw.replace(/\D/g, "");
    return /^\d{9,15}$/.test(digits) ? `+${digits}` : null;
  }
}
