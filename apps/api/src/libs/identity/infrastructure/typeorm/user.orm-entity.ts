import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { AuthProvider, InstitutionType, Role } from "../../config/identity.enums";
import { Locale } from "../../../../core/i18n/locale.enum";

@Entity("users")
export class UserOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  first_name: string;

  @Column({ type: "text", nullable: true })
  last_name: string | null;

  @Index({ unique: true })
  @Column({ type: "text", nullable: true })
  phone: string | null;

  @Index({ unique: true })
  @Column({ type: "text", nullable: true })
  email: string | null;

  @Column({ type: "text", select: false, nullable: true })
  password_hash: string | null;

  @Index({ unique: true })
  @Column({ type: "text", nullable: true })
  google_id: string | null;

  @Index({ unique: true })
  @Column({ type: "text", nullable: true })
  telegram_id: string | null;

  @Column({ type: "text", default: AuthProvider.LOCAL })
  auth_provider: AuthProvider;

  @Column({ type: "text", nullable: true })
  avatar_url: string | null;

  @Column({ type: "text", nullable: true })
  role: Role | null;

  @Column({ type: "text", nullable: true })
  institution_type: InstitutionType | null;

  @Column({ type: "text", nullable: true })
  institution_name: string | null;

  @Column({ type: "text", nullable: true })
  grade_level: string | null;

  @Column({ type: "text", nullable: true })
  subject: string | null;

  @Column({ type: "boolean", default: true })
  profile_completed: boolean;

  @Column({ type: "text", default: Locale.UZ })
  locale: Locale;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
