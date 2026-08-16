import type { NavIconName } from "../../components/NavIcon";
import type { TranslationKey } from "../../i18n/dictionary";

export const LESSON_OUTPUT: { icon: NavIconName; title: TranslationKey; detail: TranslationKey }[] =
  [
    { icon: "lessons", title: "lesson.output.plan", detail: "lesson.output.plan.detail" },
    { icon: "spark", title: "lesson.output.tasks", detail: "lesson.output.tasks.detail" },
    { icon: "stats", title: "lesson.output.criteria", detail: "lesson.output.criteria.detail" },
  ];

const TOPIC_EXAMPLES: Record<string, string[]> = {
  "ingliz tili": [
    "Present Perfect: tajriba haqida gapirish",
    "Passive voice: jarayonni tasvirlash",
    "Shopping: narx so'rash va savdolashish",
  ],
  matematika: [
    "Kvadrat tenglamalar: diskriminant",
    "Nisbat va proporsiya: amaliy masalalar",
    "Funksiya grafigi: parabola",
  ],
  fizika: [
    "Nyutonning ikkinchi qonuni",
    "Elektr zanjiri: Om qonuni",
    "Issiqlik miqdori va solishtirma issiqlik",
  ],
  kimyo: ["Kislota va asoslar reaksiyasi", "Mendeleyev jadvali: davriylik", "Mol va molyar massa"],
  biologiya: ["Fotosintez bosqichlari", "Hujayra tuzilishi", "Qon aylanish tizimi"],
  "rus tili": [
    "Падежи: винительный и родительный",
    "Глаголы движения: идти va ходить",
    "Диалог: в магазине",
  ],
  "ona tili va adabiyot": [
    "Sifatdosh va ravishdosh",
    "Alisher Navoiy g'azallari tahlili",
    "Matn tuzilishi: kirish, asosiy qism, xulosa",
  ],
  "it va dasturlash": [
    "Shartli operatorlar: if va else",
    "Massivlar bilan ishlash",
    "Funksiya: parametr va qaytish qiymati",
  ],
};

const FALLBACK_EXAMPLES = [
  "Mavzuga kirish va asosiy tushunchalar",
  "Amaliy mashqlar bilan mustahkamlash",
  "Takrorlash va nazorat ishi",
];

export function topicExamples(subject: string): string[] {
  return TOPIC_EXAMPLES[subject.trim().toLowerCase()] ?? FALLBACK_EXAMPLES;
}
