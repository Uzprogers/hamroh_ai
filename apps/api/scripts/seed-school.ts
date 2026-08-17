import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hash } from "bcryptjs";
import { DataSource } from "typeorm";
import { env } from "../src/core/config/env.config";
import {
  GROUP_CODE_ALPHABET,
  GROUP_CODE_LENGTH,
  LessonStatus,
  MemberSource,
} from "../src/libs/education/config/education.enums";
import { InstitutionType, Role } from "../src/libs/identity/config/identity.enums";
import { QuizGeneration, QuizStatus } from "../src/libs/quiz/config/quiz.enums";
import { Locale } from "../src/core/i18n/locale.enum";
import {
  AssignmentFixture,
  ClassFixture,
  CriterionFixture,
  LessonFixture,
  SchoolFixture,
  StudentFixture,
} from "./school-seed.types";

const FIXTURE = resolve(__dirname, "../fixtures/school.seed.json");
const MAX_SCORE = 10;
const MIN_SCORE = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const LESSON_GAP_DAYS = 4;
const QUIZ_HISTORY_LESSONS = 2;
const AI_MODEL = "gemini-2.5-flash";
const TRENDS = [
  { start: 5, end: 9 },
  { start: 4, end: 8.5 },
  { start: 6.5, end: 9.5 },
  { start: 3.5, end: 7 },
  { start: 8, end: 6 },
  { start: 4.5, end: 8 },
  { start: 7, end: 9 },
  { start: 5.5, end: 7.5 },
];

interface Row {
  id: string;
}

function gradeLabel(grade: number): string {
  return `${grade}-sinf`;
}

function wobble(...seeds: number[]): number {
  const mixed = seeds.reduce((sum, seed, index) => sum + seed * (index * 7 + 5), 0);
  return ((mixed % 5) - 2) / 4;
}

function scoreFor(studentIndex: number, lessonIndex: number, total: number, part: number): number {
  const trend = TRENDS[studentIndex % TRENDS.length];
  const progress = total > 1 ? lessonIndex / (total - 1) : 1;
  const base = trend.start + (trend.end - trend.start) * progress;
  const raw = base + wobble(studentIndex, lessonIndex, part);
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(raw * 2) / 2));
}

function criteriaResults(criteria: CriterionFixture[], score: number) {
  const ratio = score / MAX_SCORE;
  return criteria.map((criterion) => {
    const max = Math.round(MAX_SCORE * (criterion.weight / 100) * 10) / 10;
    return {
      name: criterion.name,
      score: Math.round(max * ratio * 10) / 10,
      max,
      comment: ratio >= 0.8 ? "Talab darajasida bajarilgan" : "Qo'shimcha mashq talab qilinadi",
    };
  });
}

function feedbackFor(score: number, topic: string): string {
  if (score >= 8) return `${topic} mavzusi o'zlashtirilgan, xatolar kam.`;
  if (score >= 6) return `${topic} bo'yicha asosiy qoidalar tushunilgan, ayrim xatolar bor.`;
  return `${topic} mavzusini qayta ko'rib chiqish va mashqlarni takrorlash kerak.`;
}

function mistakesFor(lesson: LessonFixture, score: number, studentIndex: number, part: number) {
  const pool = lesson.mistakes ?? [];
  if (!pool.length) return [];
  const total = Math.min(3, Math.max(0, Math.round((MAX_SCORE - score) / 2.5)));
  return Array.from({ length: total }, (_, index) => pool[(studentIndex + part + index) % pool.length]);
}

function answerText(student: StudentFixture, assignment: AssignmentFixture, score: number): string {
  const answer = assignment.expected_answer ?? "";
  if (score >= 8) return answer;
  if (score >= 6) return answer.slice(0, Math.max(24, Math.floor(answer.length * 0.7)));
  return `${student.first_name}: ${answer.slice(0, Math.max(16, Math.floor(answer.length * 0.4)))}`;
}

async function uniqueCode(dataSource: DataSource): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = Array.from(
      { length: GROUP_CODE_LENGTH },
      () => GROUP_CODE_ALPHABET[Math.floor(Math.random() * GROUP_CODE_ALPHABET.length)],
    ).join("");
    const taken = await dataSource.query<Row[]>(`SELECT id FROM groups WHERE code = $1`, [code]);
    if (!taken.length) return code;
  }
  throw new Error("GROUP_CODE_UNAVAILABLE");
}

async function uniquePin(dataSource: DataSource): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const taken = await dataSource.query<Row[]>(`SELECT id FROM quiz_sessions WHERE pin = $1`, [pin]);
    if (!taken.length) return pin;
  }
  throw new Error("QUIZ_PIN_UNAVAILABLE");
}

async function upsertTeacher(dataSource: DataSource, fixture: SchoolFixture): Promise<string> {
  const { teacher, school } = fixture;
  const password = process.env.SEED_TEACHER_PASSWORD;
  const passwordHash = password ? await hash(password, 10) : null;

  const [existing] = await dataSource.query<Row[]>(`SELECT id FROM users WHERE phone = $1`, [
    teacher.phone,
  ]);

  if (existing) {
    await dataSource.query(
      `UPDATE users SET role = $2, institution_type = $3, institution_name = $4, subject = $5,
              profile_completed = true, password_hash = COALESCE($6, password_hash)
       WHERE id = $1`,
      [existing.id, Role.TEACHER, InstitutionType.SCHOOL, school, teacher.subject, passwordHash],
    );
    return existing.id;
  }

  const [created] = await dataSource.query<Row[]>(
    `INSERT INTO users (first_name, last_name, phone, password_hash, role, institution_type,
                        institution_name, subject, profile_completed, locale)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9) RETURNING id`,
    [
      teacher.first_name,
      teacher.last_name,
      teacher.phone,
      passwordHash,
      Role.TEACHER,
      InstitutionType.SCHOOL,
      school,
      teacher.subject,
      Locale.UZ,
    ],
  );
  return created.id;
}

async function upsertStudent(
  dataSource: DataSource,
  student: StudentFixture,
  school: string,
  grade: number,
): Promise<string> {
  const [existing] = await dataSource.query<Row[]>(`SELECT id FROM users WHERE phone = $1`, [
    student.phone,
  ]);
  if (existing) return existing.id;

  const [created] = await dataSource.query<Row[]>(
    `INSERT INTO users (first_name, last_name, phone, role, institution_type, institution_name,
                        grade_level, profile_completed, locale)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8) RETURNING id`,
    [
      student.first_name,
      student.last_name,
      student.phone,
      Role.STUDENT,
      InstitutionType.SCHOOL,
      school,
      gradeLabel(grade),
      Locale.UZ,
    ],
  );
  return created.id;
}

async function upsertGroup(
  dataSource: DataSource,
  teacherId: string,
  klass: ClassFixture,
  subject: string,
): Promise<string> {
  const [existing] = await dataSource.query<Row[]>(
    `SELECT id FROM groups WHERE teacher_id = $1 AND name = $2 AND subject = $3`,
    [teacherId, klass.name, subject],
  );
  if (existing) return existing.id;

  const [created] = await dataSource.query<Row[]>(
    `INSERT INTO groups (teacher_id, name, subject, code, grade_level, institution_type)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [teacherId, klass.name, subject, await uniqueCode(dataSource), klass.grade_level, InstitutionType.SCHOOL],
  );
  return created.id;
}

async function seedQuizSession(
  dataSource: DataSource,
  lesson: LessonFixture,
  lessonId: string,
  teacherId: string,
  students: string[],
  playedAt: Date,
): Promise<boolean> {
  const questions = lesson.quiz ?? [];
  if (!questions.length) return false;

  const [existing] = await dataSource.query<Row[]>(
    `SELECT id FROM quiz_sessions WHERE lesson_id = $1`,
    [lessonId],
  );
  if (existing) return false;

  const [session] = await dataSource.query<Row[]>(
    `INSERT INTO quiz_sessions (lesson_id, teacher_id, pin, status, questions, generation,
                                current_index, started_at, ended_at, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $8) RETURNING id`,
    [
      lessonId,
      teacherId,
      await uniquePin(dataSource),
      QuizStatus.ENDED,
      JSON.stringify(questions),
      QuizGeneration.READY,
      questions.length - 1,
      playedAt.toISOString(),
      new Date(playedAt.getTime() + questions.length * 40 * 1000).toISOString(),
    ],
  );

  for (const [studentIndex, studentId] of students.entries()) {
    for (const [questionIndex, question] of questions.entries()) {
      const correct = (studentIndex + questionIndex) % 4 !== 0;
      const optionIndex = correct
        ? question.correct_index
        : (question.correct_index + 1) % question.options.length;
      const elapsed = 4000 + ((studentIndex * 13 + questionIndex * 7) % 11) * 900;

      await dataSource.query(
        `INSERT INTO quiz_answers (session_id, student_id, question_index, option_index, correct,
                                   elapsed_ms, score, answered_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          session.id,
          studentId,
          questionIndex,
          optionIndex,
          correct,
          elapsed,
          correct ? Math.round(1000 - (elapsed / (question.seconds * 1000)) * 500) : 0,
          new Date(playedAt.getTime() + questionIndex * 40 * 1000 + elapsed).toISOString(),
        ],
      );
    }
  }

  return true;
}

async function main(): Promise<void> {
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as SchoolFixture;
  const dataSource = new DataSource({ type: "postgres", url: env.db.url });
  await dataSource.initialize();

  const today = new Date();
  const stats = { students: 0, groups: 0, lessons: 0, submissions: 0, quizzes: 0 };

  try {
    const teacherId = await upsertTeacher(dataSource, fixture);

    for (const klass of fixture.classes) {
      const studentIds: string[] = [];
      for (const student of klass.students) {
        const id = await upsertStudent(dataSource, student, fixture.school, klass.grade_level);
        studentIds.push(id);
        stats.students += 1;
      }

      for (const [groupIndex, group] of klass.groups.entries()) {
        const groupId = await upsertGroup(dataSource, teacherId, klass, group.subject);
        stats.groups += 1;

        for (const studentId of studentIds) {
          await dataSource.query(
            `INSERT INTO group_members (group_id, student_id, source)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [groupId, studentId, MemberSource.SCHOOL],
          );
        }

        const total = group.lessons.length;
        for (const [lessonIndex, lesson] of group.lessons.entries()) {
          const [existing] = await dataSource.query<Row[]>(
            `SELECT id FROM lessons WHERE group_id = $1 AND topic = $2`,
            [groupId, lesson.topic],
          );
          if (existing) continue;

          const daysAgo = (total - lessonIndex - 1) * LESSON_GAP_DAYS + groupIndex;
          const lessonAt = new Date(today.getTime() - daysAgo * DAY_MS);
          const last = lessonIndex === total - 1;

          const [created] = await dataSource.query<Row[]>(
            `INSERT INTO lessons (group_id, teacher_id, topic, objective, plan, status, created_at)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING id`,
            [
              groupId,
              teacherId,
              lesson.topic,
              lesson.objective,
              JSON.stringify(lesson.plan ?? []),
              last ? LessonStatus.ACTIVE : LessonStatus.CLOSED,
              lessonAt.toISOString(),
            ],
          );
          stats.lessons += 1;

          for (const [part, assignment] of (lesson.assignments ?? []).entries()) {
            const [assignmentRow] = await dataSource.query<Row[]>(
              `INSERT INTO assignments (lesson_id, type, question, expected_answer, criteria, max_score, order_index)
               VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING id`,
              [
                created.id,
                assignment.type,
                assignment.question,
                assignment.expected_answer,
                JSON.stringify(assignment.criteria ?? []),
                MAX_SCORE,
                part,
              ],
            );

            for (const [studentIndex, studentId] of studentIds.entries()) {
              const score = scoreFor(studentIndex, lessonIndex, total, part);
              const submittedAt = new Date(
                lessonAt.getTime() + (90 + studentIndex * 11 + part * 7) * MINUTE_MS,
              );

              const [submission] = await dataSource.query<Row[]>(
                `INSERT INTO submissions (assignment_id, student_id, text, submitted_at)
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [
                  assignmentRow.id,
                  studentId,
                  answerText(klass.students[studentIndex], assignment, score),
                  submittedAt.toISOString(),
                ],
              );

              await dataSource.query(
                `INSERT INTO grades (submission_id, score, max_score, feedback, mistakes,
                                     criteria_results, ai_model, teacher_approved, graded_at)
                 VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, true, $8)`,
                [
                  submission.id,
                  score,
                  MAX_SCORE,
                  feedbackFor(score, lesson.topic),
                  JSON.stringify(mistakesFor(lesson, score, studentIndex, part)),
                  JSON.stringify(criteriaResults(assignment.criteria ?? [], score)),
                  AI_MODEL,
                  new Date(submittedAt.getTime() + 9 * MINUTE_MS).toISOString(),
                ],
              );
              stats.submissions += 1;
            }
          }

          if (lessonIndex >= total - QUIZ_HISTORY_LESSONS) {
            const played = await seedQuizSession(
              dataSource,
              lesson,
              created.id,
              teacherId,
              studentIds,
              new Date(lessonAt.getTime() + 40 * MINUTE_MS),
            );
            if (played) stats.quizzes += 1;
          }
        }
      }
    }

    console.log(JSON.stringify({ school: fixture.school, teacher_id: teacherId, ...stats }));
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
