import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "../application/services/auth.service";
import { RegisterDto } from "../application/dto/register.dto";
import { LoginDto } from "../application/dto/login.dto";
import { UpdateLocaleDto } from "../application/dto/update-locale.dto";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { RequestUser } from "../infrastructure/jwt.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.id);
  }

  @Patch("locale")
  @UseGuards(AuthGuard("jwt"))
  updateLocale(@CurrentUser() user: RequestUser, @Body() dto: UpdateLocaleDto) {
    return this.authService.updateLocale(user.id, dto);
  }
}
