import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { MessageSender } from "../../config/session.enums";

@Entity("session_messages")
export class SessionMessageOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  session_id: string;

  @Column({ type: "text" })
  sender: MessageSender;

  @Column({ type: "text", nullable: true })
  text: string | null;

  @Column({ type: "text", nullable: true })
  tool_name: string | null;

  @Column({ type: "jsonb", nullable: true })
  tool_result: unknown;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
