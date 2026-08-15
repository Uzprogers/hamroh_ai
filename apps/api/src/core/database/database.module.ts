import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { env } from "../config/env.config";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: env.db.url,
      autoLoadEntities: true,
      synchronize: false,
    }),
  ],
})
export class DatabaseModule {}
