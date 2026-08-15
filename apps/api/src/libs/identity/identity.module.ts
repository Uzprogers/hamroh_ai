import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { env } from "../../core/config/env.config";
import { UserOrmEntity } from "./infrastructure/typeorm/user.orm-entity";
import { JwtStrategy } from "./infrastructure/jwt.strategy";
import { AuthService } from "./application/services/auth.service";
import { AuthController } from "./presentation/auth.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: env.jwt.secret,
      signOptions: { expiresIn: env.jwt.expiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, TypeOrmModule],
})
export class IdentityModule {}
