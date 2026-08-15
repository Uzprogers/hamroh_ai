import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { TelegramLoginStatus } from "../../config/identity.enums";
import { Locale } from "../../../../core/i18n/locale.enum";

@Entity("telegram_logins")
export class TelegramLoginOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "text" })
  code: string;

  @Column({ type: "text", default: TelegramLoginStatus.PENDING })
  status: TelegramLoginStatus;

  @Column({ type: "uuid", nullable: true })
  user_id: string | null;

  @Column({ type: "text", default: Locale.UZ })
  locale: Locale;

  @Column({ type: "timestamptz" })
  expires_at: Date;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
