import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "../application/services/auth.service";
import { GoogleAuthService } from "../application/services/google-auth.service";
import { TelegramAuthService } from "../application/services/telegram-auth.service";
import { RegisterDto } from "../application/dto/register.dto";
import { LoginDto } from "../application/dto/login.dto";
import { UpdateLocaleDto } from "../application/dto/update-locale.dto";
import { GoogleLoginDto } from "../application/dto/google-login.dto";
import { TelegramSessionDto } from "../application/dto/telegram-session.dto";
import { CompleteProfileDto } from "../application/dto/complete-profile.dto";
import { Locale } from "../../../core/i18n/locale.enum";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { RequestUser } from "../infrastructure/jwt.strategy";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly telegramAuthService: TelegramAuthService,
  ) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("google")
  google(@Body() dto: GoogleLoginDto) {
    return this.googleAuthService.login(dto);
  }

  @Post("telegram/session")
  telegramSession(@Body() dto: TelegramSessionDto) {
    return this.telegramAuthService.start(dto.locale ?? Locale.UZ);
  }

  @Get("telegram/session/:code")
  telegramStatus(@Param("code") code: string) {
    return this.telegramAuthService.status(code);
  }

  @Get("providers")
  providers() {
    return { telegram: this.telegramAuthService.configured };
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.id);
  }

  @Post("profile")
  @UseGuards(AuthGuard("jwt"))
  completeProfile(@CurrentUser() user: RequestUser, @Body() dto: CompleteProfileDto) {
    return this.authService.completeProfile(user.id, dto);
  }

  @Patch("locale")
  @UseGuards(AuthGuard("jwt"))
  updateLocale(@CurrentUser() user: RequestUser, @Body() dto: UpdateLocaleDto) {
    return this.authService.updateLocale(user.id, dto);
  }
}
