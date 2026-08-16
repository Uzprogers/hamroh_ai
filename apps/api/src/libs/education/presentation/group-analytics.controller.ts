import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GroupAnalyticsService } from "../application/services/group-analytics.service";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { Roles, RolesGuard } from "../../../core/decorators/roles.decorator";
import { Role } from "../../identity/config/identity.enums";
import { RequestUser } from "../../identity/infrastructure/jwt.strategy";

@Controller("groups")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class GroupAnalyticsController {
  constructor(private readonly groupAnalyticsService: GroupAnalyticsService) {}

  @Get(":id/analytics")
  @Roles(Role.TEACHER)
  analytics(@CurrentUser() user: RequestUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.groupAnalyticsService.analytics(id, user.id);
  }
}
