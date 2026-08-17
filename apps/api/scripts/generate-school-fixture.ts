import "reflect-metadata";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { LlmService } from "../src/libs/agent/infrastructure/llm.service";
import { AssignmentType } from "../src/libs/education/config/education.enums";
import {
  CLASSES,
  SCHOOL_NAME,
  SUBJECTS,
  TEACHER,
  TOPICS,
  studentsOf,
} from "./school-blueprint";
import {
  AssignmentFixture,
  ClassFixture,
  GroupFixture,
  LessonFixture,
  SchoolFixture,
} from "./school-seed.types";

const OUTPUT = resolve(__dirname, "../fixtures/school.seed.json");

const SYSTEM = `Siz O'zbekiston umumta'lim maktabi uchun dars materiali tayyorlaydigan metodistsiz.
Faqat JSON qaytaring, boshqa matn yozmang. Format:
{"lessons":[{"topic":"...","objective":"bitta gap","plan":[{"title":"...","description":"...","minutes":15}],
"assignments":[{"type":"WRITTEN","question":"...","expected_answer":"...","criteria":[{"name":"...","weight":50,"description":"..."}]}],
"mistakes":[{"fragment":"o'quvchi yozgan xato","correction":"to'g'ri shakl","explanation":"nega xato","severity":"MAJOR"}],
"quiz":[{"text":"savol","options":["a","b","c","d"],"correct_index":0,"seconds":20}]}]}
Qoidalar:
- Berilgan mavzular ketma-ketligi va soni aynan saqlanadi, topic maydoni berilgan mavzu matni bilan bir xil bo'ladi.
- Har darsda 3 ta plan bosqichi, 2 ta assignment (biri WRITTEN, biri QUIZ), 4 ta mistake, 5 ta quiz savoli bo'ladi.
- criteria uchta bo'ladi va weight yig'indisi 100 ga teng.
- correct_index 0 dan 3 gacha, options aynan 4 ta, seconds 20 yoki 30.
- mistakes o'sha sinf o'quvchilari haqiqatan yo'l qo'yadigan xatolar bo'lsin, umumiy gap emas.
- severity faqat MAJOR yoki MINOR.
- Matn sodda, aniq va o'quvchiga tushunarli bo'lsin; hech qanday maqtov iborasi ishlatilmasin.`;

function userPrompt(grade: number, subject: string, topics: string[]): string {
  const language =
    subject === "Ingliz tili"
      ? "Savollar, javoblar va xatolar ingliz tilida, tushuntirishlar o'zbek tilida yoziladi."
      : "Hamma matn o'zbek tilida yoziladi.";

  return `Maktab: ${SCHOOL_NAME}
Sinf: ${grade}-sinf
Fan: ${subject}
${language}
Quyidagi ${topics.length} ta mavzu uchun dars materiali tuzing, tartibi o'zgarmasin:
${topics.map((topic, index) => `${index + 1}. ${topic}`).join("\n")}`;
}

const ASSIGNMENT_SYSTEM = `Siz maktab o'qituvchisi uchun topshiriq tuzasiz. Faqat JSON qaytaring:
{"assignments":[{"type":"QUIZ","question":"...","expected_answer":"...","criteria":[{"name":"...","weight":50,"description":"..."}]}]}
Har bir mavzu uchun aynan bitta topshiriq, berilgan tartibda. criteria uchta bo'ladi, weight yig'indisi 100.
QUIZ turi qisqa javobli nazorat savoli, WRITTEN turi yozma ish topshirig'i bo'ladi. Maqtov iboralari ishlatilmaydi.`;

async function fillAssignments(
  ai: LlmService,
  grade: number,
  subject: string,
  lessons: LessonFixture[],
  type: AssignmentType,
): Promise<void> {
  const pending = lessons.filter(
    (lesson) => !(lesson.assignments ?? []).some((item) => item.type === type),
  );
  if (!pending.length) return;

  const generated = await ai.json<{ assignments: AssignmentFixture[] }>(
    ASSIGNMENT_SYSTEM,
    `Sinf: ${grade}-sinf
Fan: ${subject}
Topshiriq turi: ${type}
${subject === "Ingliz tili" ? "Savol va javob ingliz tilida yoziladi." : "Hamma matn o'zbek tilida yoziladi."}
Mavzular:
${pending.map((lesson, index) => `${index + 1}. ${lesson.topic}`).join("\n")}`,
  );

  pending.forEach((lesson, index) => {
    const created = generated.assignments?.[index];
    if (!created) return;
    lesson.assignments = [...(lesson.assignments ?? []), { ...created, type }];
  });
}

async function generate(ai: LlmService): Promise<SchoolFixture> {
  const classes: ClassFixture[] = [];

  for (const [classIndex, klass] of CLASSES.entries()) {
    const groups: GroupFixture[] = [];

    for (const subject of SUBJECTS) {
      const topics = TOPICS[klass.grade_level][subject];
      process.stdout.write(`${klass.name} · ${subject} ... `);

      const generated = await ai.json<{ lessons: LessonFixture[] }>(
        SYSTEM,
        userPrompt(klass.grade_level, subject, topics),
      );

      const lessons = topics.map((topic, index) => ({
        ...generated.lessons[index],
        topic,
      }));

      groups.push({ subject, lessons });
      console.log(`${lessons.length} dars`);
    }

    classes.push({
      name: klass.name,
      grade_level: klass.grade_level,
      students: studentsOf(klass.name, classIndex),
      groups,
    });
  }

  return { school: SCHOOL_NAME, teacher: TEACHER, classes };
}

function sanitize(fixture: SchoolFixture): void {
  for (const klass of fixture.classes) {
    for (const group of klass.groups) {
      for (const lesson of group.lessons) {
        lesson.assignments = (lesson.assignments ?? []).filter(
          (item) =>
            Boolean(item?.question?.trim()) &&
            Boolean(item?.expected_answer?.trim()) &&
            (item.criteria ?? []).length >= 2,
        );
        lesson.quiz = (lesson.quiz ?? []).filter(
          (question) =>
            Boolean(question?.text?.trim()) &&
            (question.options ?? []).length === 4 &&
            question.correct_index >= 0 &&
            question.correct_index < 4,
        );
      }
    }
  }
}

async function main(): Promise<void> {
  const ai = new LlmService();
  const repair = process.argv.includes("--repair") && existsSync(OUTPUT);

  const fixture: SchoolFixture = repair
    ? (JSON.parse(readFileSync(OUTPUT, "utf8")) as SchoolFixture)
    : await generate(ai);

  sanitize(fixture);

  for (const klass of fixture.classes) {
    for (const group of klass.groups) {
      for (const type of [AssignmentType.WRITTEN, AssignmentType.QUIZ]) {
        const before = group.lessons.filter(
          (lesson) => !(lesson.assignments ?? []).some((item) => item.type === type),
        ).length;
        if (!before) continue;

        await fillAssignments(ai, klass.grade_level, group.subject, group.lessons, type);
        console.log(`${klass.name} · ${group.subject} · ${type}: ${before} ta topshiriq qo'shildi`);
      }
    }
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");

  console.log(`Fixture: ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
