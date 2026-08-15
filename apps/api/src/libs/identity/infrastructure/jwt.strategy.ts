import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "../../../core/config/env.config";
import { Role } from "../config/identity.enums";

export interface JwtPayload {
  sub: string;
  role: Role | null;
}

export interface RequestUser {
  id: string;
  role: Role | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.jwt.secret,
    });
  }

  validate(payload: JwtPayload): RequestUser {
    return { id: payload.sub, role: payload.role };
  }
}
