import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "../../app.module";
import { AuthService } from "../../libs/identity/application/services/auth.service";
import { GroupService } from "../../libs/education/application/services/group.service";
import { LessonService } from "../../libs/education/application/services/lesson.service";
import { GradingService } from "../../libs/education/application/services/grading.service";
import { InstitutionType, Role } from "../../libs/identity/config/identity.enums";
import { LessonStatus } from "../../libs/education/config/education.enums";
import { Locale } from "../i18n/locale.enum";

const TEACHER = {
  first_name: "Dilnoza",
  last_name: "Rahimova",
  phone: "+998901112233",
  password: "hamroh2026",
  role: Role.TEACHER,
  institution_type: InstitutionType.SCHOOL,
  institution_name: "Qarshi shahar 1-son maktabi",
  locale: Locale.UZ,
};

const STUDENTS = [
  { first_name: "Asrbek", last_name: "Suvonov", phone: "+998900000001" },
  { first_name: "Malika", last_name: "Yusupova", phone: "+998900000002" },
  { first_name: "Jasur", last_name: "Ergashev", phone: "+998900000003" },
  { first_name: "Nilufar", last_name: "Qodirova", phone: "+998900000004" },
  { first_name: "Sardor", last_name: "Toshmatov", phone: "+998900000005" },
  { first_name: "Zilola", last_name: "Karimova", phone: "+998900000006" },
];

const ANSWERS = [
  "Yesterday I go to the shop and I buyed some bread. My mother was very happy because I helped her.",
  "Last weekend I visited my grandmother in the village. We cooked plov together and I listened her stories.",
  "I have finished my homework yesterday evening. Then I watch a film with my brother.",
  "Last summer I traveled to Samarkand. The city was beautiful and I taked many photos of Registan.",
  "I did my project last week. It was difficult but I am learn many new words during the work.",
  "On Sunday my family and I went to the park. We played football and after we eating ice cream.",
];

async function run(): Promise<void> {
  const logger = new Logger("Seed");
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });

  const authService = app.get(AuthService);
  const groupService = app.get(GroupService);
  const lessonService = app.get(LessonService);
  const gradingService = app.get(GradingService);

  const teacher = await authService.register(TEACHER);
  logger.log(`Teacher: ${TEACHER.phone} / ${TEACHER.password}`);

  const group = await groupService.create(teacher.user.id, {
    name: "9-A",
    subject: "Ingliz tili",
    institution_type: InstitutionType.SCHOOL,
  });

  const students = [];
  for (const student of STUDENTS) {
    const created = await authService.register({
      ...student,
      password: "student123",
      role: Role.STUDENT,
      institution_type: InstitutionType.SCHOOL,
      institution_name: TEACHER.institution_name,
      grade_level: "9-sinf",
      locale: Locale.UZ,
    });
    await groupService.addMember(group.id, teacher.user.id, student.phone);
    students.push(created.user);
  }
  logger.log(`${students.length} students created (password: student123)`);

  logger.log("Generating lesson with AI...");
  const { lesson, assignments } = await lessonService.create(teacher.user.id, Locale.UZ, {
    group_id: group.id,
    topic: "Past Simple: o'tgan zamon haqida gapirish",
    note: "O'quvchilar o'tgan hafta bo'lib o'tgan voqealarni yozma va og'zaki bayon qilishi kerak",
  });
  await lessonService.changeStatus(lesson.id, teacher.user.id, LessonStatus.ACTIVE);
  logger.log(`Lesson "${lesson.topic}" with ${assignments.length} assignments`);

  const writtenAssignment = assignments.find((a) => a.type !== "QUIZ") ?? assignments[0];

  logger.log("Grading student answers with AI...");
  for (const [index, student] of students.entries()) {
    const { grade } = await gradingService.submitAndGrade(student.id, Locale.UZ, {
      assignment_id: writtenAssignment.id,
      text: ANSWERS[index],
    });
    logger.log(`  ${student.first_name}: ${grade.score}/${grade.max_score}`);
  }

  await app.close();
  logger.log("Seed complete");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
