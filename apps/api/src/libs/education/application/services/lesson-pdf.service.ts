import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import PDFDocument from "pdfkit";
import { LessonOrmEntity } from "../../infrastructure/typeorm/lesson.orm-entity";
import { AssignmentOrmEntity } from "../../infrastructure/typeorm/assignment.orm-entity";
import { GroupOrmEntity } from "../../infrastructure/typeorm/group.orm-entity";
import { AssignmentType } from "../../config/education.enums";
import { LessonPdfFile, LessonSheetSource } from "../types/lesson-pdf.types";

const MARGIN = 48;
const HEADER_FIELD_WIDTH = 196;
const HEADER_FIELD_GAP = 18;
const ANSWER_LINE_GAP = 24;
const NUMBER_WIDTH = 22;
const SCORE_WIDTH = 74;

const COLOR = {
  ink: "#0b162a",
  muted: "#5c708f",
  accent: "#0a9688",
  edge: "#d6e1f1",
};

const LABEL = {
  fields: ["Ism: ____________________", "Sinf: ______________", "Sana: ______________"],
  objective: "Maqsad:",
  tasks: "Topshiriqlar",
  key: "Javoblar kaliti",
  expected: "Namunaviy javob:",
  criteria: "Baholash mezonlari:",
};

const ANSWER_LINES: Record<AssignmentType, number> = {
  [AssignmentType.QUIZ]: 1,
  [AssignmentType.WRITTEN]: 3,
  [AssignmentType.SPEAKING]: 3,
};

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o'", қ: "q", ғ: "g'", ҳ: "h",
};

const PUNCTUATION: Record<string, string> = {
  "‘": "'", "’": "'", "ʻ": "'", "ʼ": "'", "“": '"', "”": '"',
  "–": "-", "—": "-", "…": "...",
};

function transliterate(char: string): string {
  const lower = char.toLowerCase();
  const mapped = CYRILLIC[lower];
  if (mapped === undefined) return char.charCodeAt(0) > 0xff ? "" : char;
  return char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
}

function latin(value: string): string {
  return [...value].map((char) => PUNCTUATION[char] ?? transliterate(char)).join("");
}

function slugify(value: string): string {
  const slug = latin(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "test";
}

function formatDate(value: Date): string {
  const date = new Date(value);
  const part = (input: number) => String(input).padStart(2, "0");
  return `${part(date.getDate())}.${part(date.getMonth() + 1)}.${date.getFullYear()}`;
}

@Injectable()
export class LessonPdfService {
  constructor(
    @InjectRepository(LessonOrmEntity) private readonly lessonRepo: Repository<LessonOrmEntity>,
    @InjectRepository(AssignmentOrmEntity)
    private readonly assignmentRepo: Repository<AssignmentOrmEntity>,
    @InjectRepository(GroupOrmEntity) private readonly groupRepo: Repository<GroupOrmEntity>,
  ) {}

  async build(lessonId: string, teacherId: string): Promise<LessonPdfFile> {
    const source = await this.load(lessonId, teacherId);
    const document = new PDFDocument({ size: "A4", margin: MARGIN, autoFirstPage: true });

    this.renderHeader(document, source);
    this.renderObjective(document, source.lesson.objective);
    this.renderTasks(document, source.assignments);
    this.renderAnswerKey(document, source.assignments);
    document.end();

    return { filename: `${slugify(source.lesson.topic)}.pdf`, document };
  }

  private async load(lessonId: string, teacherId: string): Promise<LessonSheetSource> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");
    if (lesson.teacher_id !== teacherId) throw new ForbiddenException("NOT_LESSON_OWNER");

    const group = await this.groupRepo.findOne({ where: { id: lesson.group_id } });
    if (!group) throw new NotFoundException("GROUP_NOT_FOUND");

    const assignments = await this.assignmentRepo.find({
      where: { lesson_id: lesson.id },
      order: { order_index: "ASC" },
    });

    return { lesson, group, assignments };
  }

  private contentWidth(doc: PDFKit.PDFDocument): number {
    return doc.page.width - MARGIN * 2;
  }

  private ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
    if (doc.y + needed > doc.page.height - MARGIN) doc.addPage();
  }

  private rule(doc: PDFKit.PDFDocument, gap = 14): void {
    doc
      .save()
      .strokeColor(COLOR.edge)
      .lineWidth(1)
      .moveTo(MARGIN, doc.y)
      .lineTo(doc.page.width - MARGIN, doc.y)
      .stroke()
      .restore();
    doc.y += gap;
  }

  private renderHeader(doc: PDFKit.PDFDocument, { lesson, group }: LessonSheetSource): void {
    const top = doc.y;
    const fieldsX = doc.page.width - MARGIN - HEADER_FIELD_WIDTH;

    doc.font("Helvetica").fontSize(10).fillColor(COLOR.muted);
    LABEL.fields.forEach((field, index) => {
      doc.text(field, fieldsX, top + index * HEADER_FIELD_GAP, { width: HEADER_FIELD_WIDTH });
    });

    const titleWidth = fieldsX - MARGIN - 20;
    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor(COLOR.ink)
      .text(latin(lesson.topic), MARGIN, top, { width: titleWidth });
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLOR.muted)
      .text(latin(`${group.name} · ${group.subject}`), MARGIN, doc.y + 4, { width: titleWidth })
      .text(formatDate(lesson.created_at), MARGIN, doc.y + 2, { width: titleWidth });

    doc.y = Math.max(doc.y, top + LABEL.fields.length * HEADER_FIELD_GAP) + 14;
    this.rule(doc);
  }

  private renderObjective(doc: PDFKit.PDFDocument, objective: string | null): void {
    if (!objective) return;
    doc
      .font("Helvetica-Oblique")
      .fontSize(10.5)
      .fillColor(COLOR.muted)
      .text(`${LABEL.objective} ${latin(objective)}`, MARGIN, doc.y, {
        width: this.contentWidth(doc),
      });
    doc.y += 18;
  }

  private renderTasks(doc: PDFKit.PDFDocument, assignments: AssignmentOrmEntity[]): void {
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLOR.accent)
      .text(LABEL.tasks, MARGIN, doc.y, { width: this.contentWidth(doc) });
    doc.y += 12;

    assignments.forEach((assignment, index) => {
      const lines = ANSWER_LINES[assignment.type] ?? ANSWER_LINES[AssignmentType.WRITTEN];
      this.ensureSpace(doc, 52 + lines * ANSWER_LINE_GAP);

      const bodyX = MARGIN + NUMBER_WIDTH;
      const bodyWidth = this.contentWidth(doc) - NUMBER_WIDTH - SCORE_WIDTH - 12;
      const top = doc.y;

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLOR.accent)
        .text(`${index + 1}.`, MARGIN, top, { width: NUMBER_WIDTH });
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLOR.muted)
        .text(`(${assignment.max_score} ball)`, doc.page.width - MARGIN - SCORE_WIDTH, top + 1, {
          width: SCORE_WIDTH,
          align: "right",
        });
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(COLOR.ink)
        .text(latin(assignment.question), bodyX, top, { width: bodyWidth });

      this.ensureSpace(doc, 14 + lines * ANSWER_LINE_GAP);
      let y = doc.y + 14;
      doc.save().strokeColor(COLOR.edge).lineWidth(0.8);
      for (let line = 0; line < lines; line += 1) {
        doc.moveTo(bodyX, y).lineTo(doc.page.width - MARGIN, y).stroke();
        y += ANSWER_LINE_GAP;
      }
      doc.restore();

      doc.y = y + 6;
    });
  }

  private renderAnswerKey(doc: PDFKit.PDFDocument, assignments: AssignmentOrmEntity[]): void {
    doc.addPage();
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(COLOR.ink)
      .text(LABEL.key, MARGIN, MARGIN, { width: this.contentWidth(doc) });
    doc.y += 10;
    this.rule(doc);

    assignments.forEach((assignment, index) => {
      this.ensureSpace(doc, 90);
      const width = this.contentWidth(doc);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLOR.ink)
        .text(`${index + 1}. ${latin(assignment.question)}`, MARGIN, doc.y, { width });

      if (assignment.expected_answer) {
        doc.y += 4;
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(COLOR.accent)
          .text(LABEL.expected, MARGIN, doc.y, { width });
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(COLOR.ink)
          .text(latin(assignment.expected_answer), MARGIN, doc.y + 2, { width });
      }

      if (assignment.criteria.length > 0) {
        doc.y += 6;
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(COLOR.muted)
          .text(LABEL.criteria, MARGIN, doc.y, { width });
        doc.font("Helvetica").fontSize(10).fillColor(COLOR.ink);
        assignment.criteria.forEach((criterion) => {
          doc.text(`• ${latin(criterion.name)} — ${criterion.weight}%`, MARGIN + 10, doc.y + 2, {
            width: width - 10,
          });
        });
      }

      doc.y += 16;
    });
  }
}
