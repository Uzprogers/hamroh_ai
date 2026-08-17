import { StudentFixture, TeacherFixture } from "./school-seed.types";

export const SCHOOL_NAME = "Qarshi shahar 1-son ixtisoslashtirilgan maktab-internati";

export const TEACHER: TeacherFixture = {
  first_name: "Asrbek",
  last_name: "Suvonov",
  phone: "+998905173007",
  subject: "Ingliz tili",
};

export const SUBJECTS = ["Matematika", "Ingliz tili", "Ona tili"] as const;

export const CLASSES = [
  { name: "7-A", grade_level: 7 },
  { name: "8-A", grade_level: 8 },
  { name: "9-A", grade_level: 9 },
] as const;

export const TOPICS: Record<number, Record<string, string[]>> = {
  7: {
    Matematika: [
      "Butun sonlar va ular ustida amallar",
      "Ratsional sonlar va koordinata to'g'ri chizig'i",
      "Bir noma'lumli chiziqli tenglamalar",
      "Nisbat, proporsiya va foizga oid masalalar",
      "Uchburchaklar va ularning tenglik belgilari",
    ],
    "Ingliz tili": [
      "Present Simple va Present Continuous farqi",
      "Past Simple: regular va irregular fe'llar",
      "Comparative va superlative adjectives",
      "Countable va uncountable nouns: some, any, much, many",
      "Talking about daily routine and free time",
    ],
    "Ona tili": [
      "So'z turkumlari: ot, sifat, son",
      "Fe'l va uning nisbat shakllari",
      "Sodda gap va uning bo'laklari",
      "Undov va so'roq gaplarda tinish belgilari",
      "Matn tuzish va bayon yozish",
    ],
  },
  8: {
    Matematika: [
      "Kvadrat ildiz va uning xossalari",
      "Kvadrat tenglamalar va Viyet teoremasi",
      "Ko'phadlarni ko'paytuvchilarga ajratish",
      "Pifagor teoremasi va uning tatbiqlari",
      "To'rtburchaklar: parallelogram, romb, trapetsiya",
    ],
    "Ingliz tili": [
      "Present Perfect: for, since, already, yet",
      "Future forms: will va be going to",
      "Modal verbs: can, must, should, have to",
      "Zero va First Conditional",
      "Describing places: tourist attractions of Uzbekistan",
    ],
    "Ona tili": [
      "Qo'shma gaplar: bog'langan va ergashgan",
      "Uyushiq bo'lakli gaplarda tinish belgilari",
      "Ajratilgan bo'laklar",
      "So'z yasalishi va so'z tarkibi",
      "Nutq uslublari: badiiy va ilmiy uslub",
    ],
  },
  9: {
    Matematika: [
      "Kvadrat funksiya va uning grafigi",
      "Tengsizliklar va tengsizliklar sistemasi",
      "Arifmetik va geometrik progressiya",
      "Aylana uzunligi va doira yuzi",
      "Ehtimollik va statistika asoslari",
    ],
    "Ingliz tili": [
      "Passive Voice: present va past shakllari",
      "Reported Speech",
      "Second Conditional va I wish gaplari",
      "Relative clauses: who, which, that",
      "Writing a formal letter and a short CV",
    ],
    "Ona tili": [
      "Murakkab qo'shma gaplar",
      "Ko'chirma va o'zlashtirma gaplar",
      "Frazeologizmlar va ularning ma'nolari",
      "Imlo qoidalari va tinish belgilari",
      "Insho yozish: mavzu, reja, xulosa",
    ],
  },
};

const NAMES: Record<string, [string, string][]> = {
  "7-A": [
    ["Diyorbek", "Xolmurodov"],
    ["Zilola", "Ergasheva"],
    ["Islombek", "Norqulov"],
    ["Robiya", "Qodirova"],
    ["Sanjar", "Tursunov"],
    ["Nilufar", "Bozorova"],
    ["Doston", "Yo'ldoshev"],
    ["Sevinch", "Rajabova"],
    ["Behruz", "Sattorov"],
    ["Malika", "Xudoyberdiyeva"],
    ["Javohir", "Mamatqulov"],
    ["Shahzoda", "Turdiyeva"],
  ],
  "8-A": [
    ["Aziz", "Sharipov"],
    ["Dilnoza", "Hamroyeva"],
    ["Otabek", "Quvondiqov"],
    ["Madina", "Ashurova"],
    ["Ulug'bek", "Jo'rayev"],
    ["Gulnoza", "Berdiyeva"],
    ["Shohruh", "Elmurodov"],
    ["Ruxshona", "Abdullayeva"],
    ["Bekzod", "Nazarov"],
    ["Zarina", "Qurbonova"],
    ["Temurbek", "Ismoilov"],
  ],
  "9-A": [
    ["Jasurbek", "Ochilov"],
    ["Sabina", "Xolmatova"],
    ["Alisher", "Rustamov"],
    ["Muslima", "Sodiqova"],
    ["Ozodbek", "Tosheva"],
    ["Kamola", "Egamberdiyeva"],
    ["Sardorbek", "Mirzayev"],
    ["Nozima", "Safarova"],
    ["Firdavs", "Boymurodov"],
    ["Iroda", "Xayitova"],
    ["Xurshid", "Amonov"],
    ["Feruza", "Normurodova"],
  ],
};

export function studentsOf(className: string, classIndex: number): StudentFixture[] {
  return NAMES[className].map(([first_name, last_name], index) => ({
    first_name,
    last_name,
    phone: `+99890${9000000 + classIndex * 100 + index}`,
  }));
}
