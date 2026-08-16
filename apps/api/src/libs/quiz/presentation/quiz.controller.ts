import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { QuizService } from "../application/services/quiz.service";
import { CreateQuizSessionDto } from "../application/dto/create-quiz-session.dto";
import { JoinQuizGroupDto } from "../application/dto/join-quiz-group.dto";
import { AuthService } from "../../identity/application/services/auth.service";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { Roles, RolesGuard } from "../../../core/decorators/roles.decorator";
import { Role } from "../../identity/config/identity.enums";
import { RequestUser } from "../../identity/infrastructure/jwt.strategy";
import {
  QuizAttempt,
  QuizReport,
  QuizResults,
  QuizSummary,
} from "../application/types/quiz.types";

@Controller("quiz")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly authService: AuthService,
  ) {}

  @Post("sessions")
  @Roles(Role.TEACHER)
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateQuizSessionDto,
  ): Promise<QuizSummary> {
    const profile = await this.authService.me(user.id);
    return this.quizService.createSession(user.id, profile.locale, dto.lesson_id);
  }

  @Get("sessions/by-pin/:pin")
  byPin(@CurrentUser() user: RequestUser, @Param("pin") pin: string): Promise<QuizSummary> {
    return this.quizService.summaryByPin(pin, user.id);
  }

  @Post("sessions/join")
  @Roles(Role.STUDENT)
  join(@CurrentUser() user: RequestUser, @Body() dto: JoinQuizGroupDto): Promise<QuizSummary> {
    return this.quizService.joinByPin(dto.pin, user.id);
  }

  @Get("mine")
  @Roles(Role.STUDENT)
  mine(@CurrentUser() user: RequestUser): Promise<QuizAttempt[]> {
    return this.quizService.attempts(user.id);
  }

  @Get("sessions/:id/report")
  @Roles(Role.STUDENT)
  report(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<QuizReport> {
    return this.quizService.report(id, user.id);
  }

  @Get("sessions/:id/results")
  @Roles(Role.TEACHER)
  results(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<QuizResults> {
    return this.quizService.results(id, user.id);
  }
}
