import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestUser } from "../../libs/identity/infrastructure/jwt.strategy";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => ctx.switchToHttp().getRequest().user,
);
