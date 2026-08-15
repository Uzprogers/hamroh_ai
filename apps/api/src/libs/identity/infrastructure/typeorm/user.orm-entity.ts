import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { InstitutionType, Role } from "../../config/identity.enums";
import { Locale } from "../../../../core/i18n/locale.enum";

@Entity("users")
export class UserOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  first_name: string;

  @Column({ type: "text" })
  last_name: string;

  @Index({ unique: true })
  @Column({ type: "text" })
  phone: string;

  @Column({ type: "text", select: false })
  password_hash: string;

  @Column({ type: "text" })
  role: Role;

  @Column({ type: "text" })
  institution_type: InstitutionType;

  @Column({ type: "text" })
  institution_name: string;

  @Column({ type: "text", nullable: true })
  grade_level: string | null;

  @Column({ type: "text", default: Locale.UZ })
  locale: Locale;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
