import { DataSource } from "typeorm";
import { env } from "../src/core/config/env.config";
import {
  AssignmentType,
  ErrorSeverity,
  LessonStatus,
} from "../src/libs/education/config/education.enums";

interface CriterionBlueprint {
  name: string;
  weight: number;
  description: string;
}

interface AssignmentBlueprint {
  type: AssignmentType;
  question: string;
  expected_answer: string;
  criteria: CriterionBlueprint[];
}

interface MistakeBlueprint {
  fragment: string;
  correction: string;
  explanation: string;
  severity: ErrorSeverity;
}

interface PlanStepBlueprint {
  title: string;
  description: string;
  minutes: number;
}

interface LessonBlueprint {
  topic: string;
  objective: string;
  days_ago: number;
  plan: PlanStepBlueprint[];
  assignments: AssignmentBlueprint[];
  mistakes: MistakeBlueprint[];
}

interface StudentTrend {
  start: number;
  end: number;
}

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
}

const GROUP_NAME = "9-A";
const TEACHER_FIRST_NAME = "Dilnoza";
const AI_MODEL = "mock";
const MAX_SCORE = 10;
const MIN_SCORE = 2;
const TODAY = new Date("2026-08-16T10:00:00+05:00");
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const WRITING_CRITERIA: CriterionBlueprint[] = [
  { name: "Grammatika", weight: 50, description: "Zamon va fe'l shakllarining to'g'riligi" },
  { name: "Lug'at", weight: 30, description: "So'z boyligi va mos so'z tanlash" },
  { name: "Mazmun", weight: 20, description: "Fikrning to'liq va izchil bayoni" },
];

const QUIZ_CRITERIA: CriterionBlueprint[] = [
  { name: "Grammatika", weight: 70, description: "Qoidaning to'g'ri qo'llanishi" },
  { name: "Aniqlik", weight: 30, description: "Javoblarning xatosizligi" },
];

const TRENDS: StudentTrend[] = [
  { start: 4, end: 9 },
  { start: 3.5, end: 8.5 },
  { start: 5, end: 8.5 },
  { start: 4.5, end: 9 },
  { start: 8, end: 5 },
  { start: 7.5, end: 4.5 },
];

const LESSONS: LessonBlueprint[] = [
  {
    topic: "Past Simple: tartibsiz fe'llar",
    objective: "Tartibsiz fe'llarning ikkinchi shaklini og'zaki va yozma nutqda qo'llash",
    days_ago: 5,
    plan: [
      { title: "Warm-up", description: "Kecha nima qilganingiz haqida 3 gap", minutes: 7 },
      { title: "Tushuntirish", description: "Tartibsiz fe'llar jadvali", minutes: 15 },
      { title: "Amaliyot", description: "Gaplarni Past Simple'ga o'girish", minutes: 18 },
    ],
    assignments: [
      {
        type: AssignmentType.WRITTEN,
        question: "Write 5 sentences about your last weekend using irregular verbs.",
        expected_answer: "I went to the park. I saw my friends. We ate pizza.",
        criteria: WRITING_CRITERIA,
      },
      {
        type: AssignmentType.QUIZ,
        question: "Put the verbs in brackets into Past Simple: (go), (buy), (write), (take), (see).",
        expected_answer: "went, bought, wrote, took, saw",
        criteria: QUIZ_CRITERIA,
      },
    ],
    mistakes: [
      {
        fragment: "I goed to the market",
        correction: "I went to the market",
        explanation: "go fe'li tartibsiz, Past Simple shakli went bo'ladi",
        severity: ErrorSeverity.MAJOR,
      },
      {
        fragment: "She buyed a new book",
        correction: "She bought a new book",
        explanation: "buy fe'lining o'tgan zamon shakli bought",
        severity: ErrorSeverity.MAJOR,
      },
      {
        fragment: "We did not went home",
        correction: "We did not go home",
        explanation: "did bilan asosiy fe'l boshlang'ich shaklda qoladi",
        severity: ErrorSeverity.MAJOR,
      },
      {
        fragment: "yesterday i seen him",
        correction: "Yesterday I saw him",
        explanation: "seen uchinchi shakl, Past Simple uchun saw kerak",
        severity: ErrorSeverity.MINOR,
      },
    ],
  },
  {
    topic: "Present Perfect va Past Simple farqi",
    objective: "Tugagan vaqt va natija ma'nosini ajratib, ikkala zamonni to'g'ri tanlash",
    days_ago: 4,
    plan: [
      { title: "Taqqoslash", description: "just, already, yet signallari", minutes: 12 },
      { title: "Amaliyot", description: "Zamonni tanlash mashqi", minutes: 20 },
      { title: "Nutq", description: "Have you ever ... savol-javob", minutes: 13 },
    ],
    assignments: [
      {
        type: AssignmentType.WRITTEN,
        question: "Describe your experience with travelling. Use Present Perfect and Past Simple.",
        expected_answer: "I have been to Samarkand twice. I went there last summer.",
        criteria: WRITING_CRITERIA,
      },
      {
        type: AssignmentType.QUIZ,
        question: "Choose the correct tense: I (finish) my homework already.",
        expected_answer: "I have already finished my homework.",
        criteria: QUIZ_CRITERIA,
      },
      {
        type: AssignmentType.WRITTEN,
        question: "Write 3 questions with 'Have you ever ...?' and answer them.",
        expected_answer: "Have you ever tried sushi? Yes, I have.",
        criteria: WRITING_CRITERIA,
      },
    ],
    mistakes: [
      {
        fragment: "I have seen him yesterday",
        correction: "I saw him yesterday",
        explanation: "yesterday aniq o'tgan vaqt, shuning uchun Past Simple ishlatiladi",
        severity: ErrorSeverity.MAJOR,
      },
      {
        fragment: "She has went to school",
        correction: "She has gone to school",
        explanation: "Present Perfect'da fe'lning uchinchi shakli kerak",
        severity: ErrorSeverity.MAJOR,
      },
      {
        fragment: "I am living here since 2019",
        correction: "I have lived here since 2019",
        explanation: "since bilan Present Perfect qo'llanadi",
        severity: ErrorSeverity.MINOR,
      },
      {
        fragment: "Did you ever been to London?",
        correction: "Have you ever been to London?",
        explanation: "ever bilan tajriba haqida so'ralganda Present Perfect ishlatiladi",
        severity: ErrorSeverity.MINOR,
      },
    ],
  },
  {
    topic: "Modal verbs: must, should, can",
    objective: "Majburiyat, maslahat va imkoniyat ma'nolarini modal fe'llar bilan ifodalash",
    days_ago: 2,
    plan: [
      { title: "Kirish", description: "Maktab qoidalari misolida must", minutes: 10 },
      { title: "Tushuntirish", description: "should va can farqi", minutes: 15 },
      { title: "Rolli o'yin", description: "Maslahat berish dialogi", minutes: 15 },
    ],
    assignments: [
      {
        type: AssignmentType.WRITTEN,
        question: "Write 5 school rules using must, mustn't and should.",
        expected_answer: "Students must come on time. You shouldn't shout in the corridor.",
        criteria: WRITING_CRITERIA,
      },
      {
        type: AssignmentType.QUIZ,
        question: "Complete: You ___ smoke here. He ___ swim very well.",
        expected_answer: "mustn't, can",
        criteria: QUIZ_CRITERIA,
      },
    ],
    mistakes: [
      {
        fragment: "You must to come early",
        correction: "You must come early",
        explanation: "modal fe'ldan keyin to qo'yilmaydi",
        severity: ErrorSeverity.MAJOR,
      },
      {
        fragment: "He cans swim",
        correction: "He can swim",
        explanation: "modal fe'llar uchinchi shaxsda -s qo'shimchasini olmaydi",
        severity: ErrorSeverity.MAJOR,
      },
      {
        fragment: "We should to study more",
        correction: "We should study more",
        explanation: "should ham to'g'ridan-to'g'ri fe'l bilan keladi",
        severity: ErrorSeverity.MINOR,
      },
      {
        fragment: "You not must run here",
        correction: "You mustn't run here",
        explanation: "inkor modal fe'lning o'ziga qo'shiladi",
        severity: ErrorSeverity.MINOR,
      },
    ],
  },
  {
    topic: "Conditionals: birinchi va ikkinchi tur shart gaplar",
    objective: "Real va noreal shartni to'g'ri zamon shakllari bilan ifodalash",
    days_ago: 1,
    plan: [
      { title: "Kirish", description: "If bilan real vaziyatlar", minutes: 10 },
      { title: "Tushuntirish", description: "1-tur va 2-tur formulasi", minutes: 15 },
      { title: "Amaliyot", description: "Gaplarni tugatish mashqi", minutes: 18 },
    ],
    assignments: [
      {
        type: AssignmentType.WRITTEN,
        question: "Finish the sentences: If I have free time ... / If I were a teacher ...",
        expected_answer: "If I have free time, I will read a book. If I were a teacher, I would help students.",
        criteria: WRITING_CRITERIA,
      },
      {
        type: AssignmentType.QUIZ,
        question: "Choose the correct form: If it (rain), we (stay) at home.",
        expected_answer: "If it rains, we will stay at home.",
        criteria: QUIZ_CRITERIA,
      },
      {
        type: AssignmentType.WRITTEN,
        question: "Write 3 second conditional sentences about your dreams.",
        expected_answer: "If I had a lot of money, I would travel around the world.",
        criteria: WRITING_CRITERIA,
      },
    ],
    mistakes: [
      {
        fragment: "If I will have time, I will call you",
        correction: "If I have time, I will call you",
        explanation: "1-tur shart gapda if qismida will ishlatilmaydi",
        severity: ErrorSeverity.MAJOR,
      },
      {
        fragment: "If I was you, I would go",
        correction: "If I were you, I would go",
        explanation: "2-tur shart gapda were shakli qo'llanadi",
        severity: ErrorSeverity.MINOR,
      },
      {
        fragment: "If she studied, she will pass",
        correction: "If she studied, she would pass",
        explanation: "2-tur shart gapda natija qismida would kerak",
        severity: ErrorSeverity.MAJOR,
      },
      {
        fragment: "If it rain, we stay home",
        correction: "If it rains, we will stay home",
        explanation: "uchinchi shaxsda -s va natija qismida will kerak",
        severity: ErrorSeverity.MINOR,
      },
    ],
  },
];

function lessonDate(daysAgo: number): Date {
  return new Date(TODAY.getTime() - daysAgo * DAY_MS);
}

function submissionDate(lessonAt: Date, studentIndex: number, assignmentIndex: number): Date {
  return new Date(lessonAt.getTime() + (120 + studentIndex * 17 + assignmentIndex * 9) * MINUTE_MS);
}

function wobble(studentIndex: number, lessonIndex: number, assignmentIndex: number): number {
  return (((studentIndex * 7 + lessonIndex * 13 + assignmentIndex * 5) % 5) - 2) / 4;
}

function scoreFor(
  trend: StudentTrend,
  lessonIndex: number,
  studentIndex: number,
  assignmentIndex: number,
): number {
  const progress = lessonIndex / (LESSONS.length - 1);
  const base = trend.start + (trend.end - trend.start) * progress;
  const raw = base + wobble(studentIndex, lessonIndex, assignmentIndex);
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(raw * 2) / 2));
}

function mistakesFor(
  blueprint: LessonBlueprint,
  score: number,
  studentIndex: number,
  assignmentIndex: number,
): MistakeBlueprint[] {
  const total = Math.min(3, Math.max(0, Math.round((MAX_SCORE - score) / 2.5)));
  return Array.from({ length: total }, (_, index) => {
    const position = (studentIndex + assignmentIndex + index) % blueprint.mistakes.length;
    return blueprint.mistakes[position];
  });
}

function criteriaResults(criteria: CriterionBlueprint[], score: number) {
  const ratio = score / MAX_SCORE;
  return criteria.map((criterion) => {
    const max = Math.round(MAX_SCORE * criterion.weight * 10) / 10;
    return {
      name: criterion.name,
      score: Math.round(max * ratio * 10) / 10,
      max,
      comment: ratio >= 0.8 ? "Mustahkam natija" : "Qo'shimcha mashq talab qilinadi",
    };
  });
}

function feedbackFor(score: number, topic: string): string {
  if (score >= 8) return `${topic} mavzusi yaxshi o'zlashtirilgan, xatolar kam.`;
  if (score >= 6) return `${topic} bo'yicha asosiy qoidalar tushunilgan, ayrim xatolar bor.`;
  return `${topic} mavzusini qayta ko'rib chiqish va mashqlarni takrorlash kerak.`;
}

async function main(): Promise<void> {
  const dataSource = new DataSource({ type: "postgres", url: env.db.url });
  await dataSource.initialize();

  try {
    const [teacher] = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM users WHERE role = 'TEACHER' AND first_name = $1 ORDER BY created_at ASC LIMIT 1`,
      [TEACHER_FIRST_NAME],
    );
    if (!teacher) throw new Error(`Ustoz topilmadi: ${TEACHER_FIRST_NAME}`);

    const [group] = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM groups WHERE teacher_id = $1 AND name = $2 LIMIT 1`,
      [teacher.id, GROUP_NAME],
    );
    if (!group) throw new Error(`Guruh topilmadi: ${GROUP_NAME}`);

    const students = await dataSource.query<StudentRow[]>(
      `SELECT u.id, u.first_name, u.last_name
       FROM group_members m
       JOIN users u ON u.id = m.student_id
       WHERE m.group_id = $1
       ORDER BY u.first_name ASC`,
      [group.id],
    );
    if (!students.length) throw new Error("Guruhda o'quvchi yo'q");

    let createdLessons = 0;
    let createdAssignments = 0;
    let createdSubmissions = 0;
    let skippedLessons = 0;

    for (const [lessonIndex, blueprint] of LESSONS.entries()) {
      const [existing] = await dataSource.query<{ id: string }[]>(
        `SELECT id FROM lessons WHERE group_id = $1 AND topic = $2 LIMIT 1`,
        [group.id, blueprint.topic],
      );
      if (existing) {
        skippedLessons += 1;
        continue;
      }

      const lessonAt = lessonDate(blueprint.days_ago);
      const [lesson] = await dataSource.query<{ id: string }[]>(
        `INSERT INTO lessons (group_id, teacher_id, topic, objective, plan, status, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING id`,
        [
          group.id,
          teacher.id,
          blueprint.topic,
          blueprint.objective,
          JSON.stringify(blueprint.plan),
          LessonStatus.CLOSED,
          lessonAt.toISOString(),
        ],
      );
      createdLessons += 1;

      for (const [assignmentIndex, assignment] of blueprint.assignments.entries()) {
        const [created] = await dataSource.query<{ id: string }[]>(
          `INSERT INTO assignments (lesson_id, type, question, expected_answer, criteria, max_score, order_index)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING id`,
          [
            lesson.id,
            assignment.type,
            assignment.question,
            assignment.expected_answer,
            JSON.stringify(assignment.criteria),
            MAX_SCORE,
            assignmentIndex,
          ],
        );
        createdAssignments += 1;

        for (const [studentIndex, student] of students.entries()) {
          const trend = TRENDS[studentIndex % TRENDS.length];
          const score = scoreFor(trend, lessonIndex, studentIndex, assignmentIndex);
          const submittedAt = submissionDate(lessonAt, studentIndex, assignmentIndex);

          const [submission] = await dataSource.query<{ id: string }[]>(
            `INSERT INTO submissions (assignment_id, student_id, text, submitted_at)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [
              created.id,
              student.id,
              `${student.first_name} javobi: ${assignment.expected_answer}`,
              submittedAt.toISOString(),
            ],
          );
          createdSubmissions += 1;

          await dataSource.query(
            `INSERT INTO grades (submission_id, score, max_score, feedback, mistakes, criteria_results, ai_model, teacher_approved, graded_at)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9)`,
            [
              submission.id,
              score,
              MAX_SCORE,
              feedbackFor(score, blueprint.topic),
              JSON.stringify(mistakesFor(blueprint, score, studentIndex, assignmentIndex)),
              JSON.stringify(criteriaResults(assignment.criteria, score)),
              AI_MODEL,
              true,
              new Date(submittedAt.getTime() + 12 * MINUTE_MS).toISOString(),
            ],
          );
        }
      }
    }

    console.log(
      JSON.stringify({
        group_id: group.id,
        teacher_id: teacher.id,
        students: students.length,
        created_lessons: createdLessons,
        created_assignments: createdAssignments,
        created_submissions: createdSubmissions,
        skipped_lessons: skippedLessons,
      }),
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
