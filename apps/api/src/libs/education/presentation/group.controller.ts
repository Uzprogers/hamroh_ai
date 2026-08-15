import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GroupService } from "../application/services/group.service";
import { ResultsService } from "../application/services/results.service";
import { CreateGroupDto } from "../application/dto/create-group.dto";
import { AddMemberDto } from "../application/dto/add-member.dto";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { Roles, RolesGuard } from "../../../core/decorators/roles.decorator";
import { Role } from "../../identity/config/identity.enums";
import { RequestUser } from "../../identity/infrastructure/jwt.strategy";

@Controller("groups")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly resultsService: ResultsService,
  ) {}

  @Post()
  @Roles(Role.TEACHER)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateGroupDto) {
    return this.groupService.create(user.id, dto);
  }

  @Get()
  @Roles(Role.TEACHER)
  list(@CurrentUser() user: RequestUser) {
    return this.groupService.listForTeacher(user.id);
  }

  @Get("mine")
  @Roles(Role.STUDENT)
  mine(@CurrentUser() user: RequestUser) {
    return this.groupService.listForStudent(user.id);
  }

  @Get(":id/members")
  @Roles(Role.TEACHER)
  members(@CurrentUser() user: RequestUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.groupService.members(id, user.id);
  }

  @Post(":id/members")
  @Roles(Role.TEACHER)
  addMember(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.groupService.addMember(id, user.id, dto.phone);
  }

  @Get(":id/summary")
  @Roles(Role.TEACHER)
  summary(@CurrentUser() user: RequestUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.resultsService.groupSummary(id, user.id);
  }
}
