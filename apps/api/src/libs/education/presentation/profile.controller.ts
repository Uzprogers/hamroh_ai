import { BadRequestException, Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AnalyticsService } from "../application/services/analytics.service";
import { AuthService } from "../../identity/application/services/auth.service";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { RequestUser } from "../../identity/infrastructure/jwt.strategy";

@Controller("profile")
@UseGuards(AuthGuard("jwt"))
export class ProfileController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly authService: AuthService,
  ) {}

  @Get("stats")
  async stats(@CurrentUser() user: RequestUser) {
    const profile = await this.authService.me(user.id);
    if (!profile.role) throw new BadRequestException("PROFILE_INCOMPLETE");
    return this.analyticsService.profileStats(profile.id, profile.role);
  }
}
