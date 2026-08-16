import { Controller, Get, Param, ParseUUIDPipe, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { LessonPdfService } from "../application/services/lesson-pdf.service";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { Roles, RolesGuard } from "../../../core/decorators/roles.decorator";
import { Role } from "../../identity/config/identity.enums";
import { RequestUser } from "../../identity/infrastructure/jwt.strategy";

@Controller("lessons")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class LessonPdfController {
  constructor(private readonly lessonPdfService: LessonPdfService) {}

  @Get(":id/pdf")
  @Roles(Role.TEACHER)
  async download(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, document } = await this.lessonPdfService.build(id, user.id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    document.pipe(res);
  }
}
