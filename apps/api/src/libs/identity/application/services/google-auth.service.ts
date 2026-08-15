import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { env } from "../../../../core/config/env.config";
import { Locale } from "../../../../core/i18n/locale.enum";
import { AuthProvider } from "../../config/identity.enums";
import { UserOrmEntity } from "../../infrastructure/typeorm/user.orm-entity";
import { GoogleProfileClient } from "../../infrastructure/google-profile.client";
import { GoogleLoginDto } from "../dto/google-login.dto";
import { AuthResult, AuthService } from "./auth.service";

@Injectable()
export class GoogleAuthService {
  constructor(
    @InjectRepository(UserOrmEntity) private readonly userRepo: Repository<UserOrmEntity>,
    private readonly googleClient: GoogleProfileClient,
    private readonly authService: AuthService,
  ) {}

  async login(dto: GoogleLoginDto): Promise<AuthResult> {
    if (!env.google.clientId) throw new ServiceUnavailableException("GOOGLE_NOT_CONFIGURED");

    const profile = await this.googleClient.fetchProfile(dto.token);

    const linked = await this.userRepo.findOne({ where: { google_id: profile.sub } });
    if (linked) return this.authService.issue(linked);

    const byEmail = await this.userRepo.findOne({ where: { email: profile.email } });
    if (byEmail) {
      byEmail.google_id = profile.sub;
      byEmail.avatar_url = byEmail.avatar_url ?? profile.picture;
      return this.authService.issue(await this.userRepo.save(byEmail));
    }

    const created = await this.userRepo.save(
      this.userRepo.create({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        google_id: profile.sub,
        avatar_url: profile.picture,
        auth_provider: AuthProvider.GOOGLE,
        profile_completed: false,
        locale: dto.locale ?? Locale.UZ,
      }),
    );

    return this.authService.issue(created);
  }
}
