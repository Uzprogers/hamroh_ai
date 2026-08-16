import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GradingService } from "../application/services/grading.service";
import { ResultsService } from "../application/services/results.service";
import { GroupService } from "../application/services/group.service";
import { SubmitAnswerDto } from "../application/dto/submit-answer.dto";
import { AuthService } from "../../identity/application/services/auth.service";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { Roles, RolesGuard } from "../../../core/decorators/roles.decorator";
import { Role } from "../../identity/config/identity.enums";
import { RequestUser } from "../../identity/infrastructure/jwt.strategy";

@Controller()
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class SubmissionController {
  constructor(
    private readonly gradingService: GradingService,
    private readonly resultsService: ResultsService,
    private readonly groupService: GroupService,
    private readonly authService: AuthService,
  ) {}

  @Post("submissions")
  @Roles(Role.STUDENT)
  async submit(@CurrentUser() user: RequestUser, @Body() dto: SubmitAnswerDto) {
    const profile = await this.authService.me(user.id);
    return this.gradingService.submitAndGrade(user.id, profile.locale, dto);
  }

  @Get("results/mine")
  @Roles(Role.STUDENT)
  mine(@CurrentUser() user: RequestUser) {
    return this.resultsService.studentResults(user.id);
  }

  @Get("results/student/:id")
  @Roles(Role.TEACHER)
  async student(@CurrentUser() user: RequestUser, @Param("id", ParseUUIDPipe) id: string) {
    await this.groupService.assertStudentAccess(id, user.id);
    return this.resultsService.studentResults(id);
  }

  @Post("grades/:id/approve")
  @Roles(Role.TEACHER)
  approve(@CurrentUser() user: RequestUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.gradingService.approve(id, user.id);
  }
}
