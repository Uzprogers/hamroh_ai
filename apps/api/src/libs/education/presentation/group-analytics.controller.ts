import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GroupAnalyticsService } from "../application/services/group-analytics.service";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { Roles, RolesGuard } from "../../../core/decorators/roles.decorator";
import { Role } from "../../identity/config/identity.enums";
import { RequestUser } from "../../identity/infrastructure/jwt.strategy";

const OptionalUuidPipe = new ParseUUIDPipe({ optional: true });

@Controller("groups")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class GroupAnalyticsController {
  constructor(private readonly groupAnalyticsService: GroupAnalyticsService) {}

  @Get(":id/analytics")
  @Roles(Role.TEACHER)
  analytics(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("lesson_id", OptionalUuidPipe) lessonId?: string,
  ) {
    return this.groupAnalyticsService.analytics(id, user.id, lessonId ?? null);
  }

  @Get(":id/students/:studentId/detail")
  @Roles(Role.TEACHER)
  studentDetail(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("studentId", ParseUUIDPipe) studentId: string,
  ) {
    return this.groupAnalyticsService.studentDetail(id, studentId, user.id);
  }
}
