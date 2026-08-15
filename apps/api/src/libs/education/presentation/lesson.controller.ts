import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { LessonService } from "../application/services/lesson.service";
import { CreateLessonDto } from "../application/dto/create-lesson.dto";
import { LessonStatusDto } from "../application/dto/lesson-status.dto";
import { AuthService } from "../../identity/application/services/auth.service";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { Roles, RolesGuard } from "../../../core/decorators/roles.decorator";
import { Role } from "../../identity/config/identity.enums";
import { RequestUser } from "../../identity/infrastructure/jwt.strategy";

@Controller("lessons")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class LessonController {
  constructor(
    private readonly lessonService: LessonService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @Roles(Role.TEACHER)
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateLessonDto) {
    const profile = await this.authService.me(user.id);
    return this.lessonService.create(user.id, profile.locale, dto);
  }

  @Get()
  @Roles(Role.TEACHER)
  list(@CurrentUser() user: RequestUser) {
    return this.lessonService.listForTeacher(user.id);
  }

  @Get("mine")
  @Roles(Role.STUDENT)
  mine(@CurrentUser() user: RequestUser) {
    return this.lessonService.listForStudent(user.id);
  }

  @Get(":id")
  detail(@CurrentUser() user: RequestUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.lessonService.detail(id, user.id, user.role === Role.TEACHER);
  }

  @Patch(":id/status")
  @Roles(Role.TEACHER)
  changeStatus(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: LessonStatusDto,
  ) {
    return this.lessonService.changeStatus(id, user.id, dto.status);
  }
}
