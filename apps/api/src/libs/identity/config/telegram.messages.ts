import { Locale } from "../../../core/i18n/locale.enum";

export interface TelegramCopy {
  greeting: string;
  askContact: string;
  shareContact: string;
  needContact: string;
  foreignContact: string;
  approved: string;
  expired: string;
  unknown: string;
}

export const TELEGRAM_COPY: Record<Locale, TelegramCopy> = {
  [Locale.UZ]: {
    greeting: "Assalomu alaykum! Hamroh AI'ga kirish uchun saytdagi Telegram tugmasidan foydalaning.",
    askContact:
      "Hamroh AI'ga kirmoqchisiz. Kirish uchun telefon raqamingiz kerak — pastdagi tugmani bosing.",
    shareContact: "Raqamni ulashish",
    needContact: "Kirish faqat telefon raqam bilan. Pastdagi tugma orqali raqamingizni ulashing.",
    foreignContact: "Faqat o'z raqamingizni ulashing.",
    approved: "Kirish tasdiqlandi. Brauzerga qayting.",
    expired: "Kod muddati tugagan. Saytdan yangi kod oling.",
    unknown: "Bu kod topilmadi. Saytdan yangi kod oling.",
  },
  [Locale.RU]: {
    greeting: "Здравствуйте! Чтобы войти в Hamroh AI, нажмите кнопку Telegram на сайте.",
    askContact:
      "Вы входите в Hamroh AI. Для входа нужен номер телефона — нажмите кнопку ниже.",
    shareContact: "Поделиться номером",
    needContact: "Вход возможен только с номером телефона. Поделитесь им кнопкой ниже.",
    foreignContact: "Отправьте только свой номер.",
    approved: "Вход подтверждён. Вернитесь в браузер.",
    expired: "Срок действия кода истёк. Получите новый код на сайте.",
    unknown: "Код не найден. Получите новый код на сайте.",
  },
  [Locale.EN]: {
    greeting: "Hello. To sign in to Hamroh AI, use the Telegram button on the website.",
    askContact: "You are signing in to Hamroh AI. Sign-in needs your phone number — tap the button below.",
    shareContact: "Share phone number",
    needContact: "Sign-in requires a phone number. Share yours with the button below.",
    foreignContact: "Share your own number only.",
    approved: "Sign-in confirmed. Return to your browser.",
    expired: "This code has expired. Get a new one on the website.",
    unknown: "Code not found. Get a new one on the website.",
  },
};
