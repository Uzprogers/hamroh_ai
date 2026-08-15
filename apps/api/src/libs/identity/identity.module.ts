import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { env } from "../../core/config/env.config";
import { UserOrmEntity } from "./infrastructure/typeorm/user.orm-entity";
import { TelegramLoginOrmEntity } from "./infrastructure/typeorm/telegram-login.orm-entity";
import { JwtStrategy } from "./infrastructure/jwt.strategy";
import { GoogleProfileClient } from "./infrastructure/google-profile.client";
import { TelegramBotService } from "./infrastructure/telegram-bot.service";
import { AuthService } from "./application/services/auth.service";
import { GoogleAuthService } from "./application/services/google-auth.service";
import { TelegramAuthService } from "./application/services/telegram-auth.service";
import { AuthController } from "./presentation/auth.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, TelegramLoginOrmEntity]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: env.jwt.secret,
      signOptions: { expiresIn: env.jwt.expiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleAuthService,
    TelegramAuthService,
    GoogleProfileClient,
    TelegramBotService,
    JwtStrategy,
  ],
  exports: [AuthService, JwtModule, TypeOrmModule],
})
export class IdentityModule {}
