import { DataSource } from "typeorm";
import { env } from "./core/config/env.config";

export default new DataSource({
  type: "postgres",
  url: env.db.url,
  entities: [__dirname + "/libs/**/*.orm-entity{.ts,.js}"],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  synchronize: false,
});
