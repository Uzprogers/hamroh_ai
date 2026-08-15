import { Locale } from "../../../core/i18n/locale.enum";

interface TelegramCopy {
  greeting: string;
  askContact: string;
  shareContact: string;
  skipContact: string;
  approved: string;
  expired: string;
  unknown: string;
}

export const TELEGRAM_COPY: Record<Locale, TelegramCopy> = {
  [Locale.UZ]: {
    greeting: "Assalomu alaykum! Hamroh AI'ga kirish uchun saytdagi Telegram tugmasidan foydalaning.",
    askContact: "Hamroh AI'ga kirmoqchisiz. Tasdiqlash uchun tugmani bosing.",
    shareContact: "Raqamni ulashish",
    skipContact: "Raqamsiz davom etish",
    approved: "Kirish tasdiqlandi. Brauzerga qayting.",
    expired: "Kod muddati tugagan. Saytdan yangi kod oling.",
    unknown: "Bu kod topilmadi. Saytdan yangi kod oling.",
  },
  [Locale.RU]: {
    greeting: "Здравствуйте! Чтобы войти в Hamroh AI, нажмите кнопку Telegram на сайте.",
    askContact: "Вы входите в Hamroh AI. Нажмите кнопку для подтверждения.",
    shareContact: "Поделиться номером",
    skipContact: "Продолжить без номера",
    approved: "Вход подтверждён. Вернитесь в браузер.",
    expired: "Срок действия кода истёк. Получите новый код на сайте.",
    unknown: "Код не найден. Получите новый код на сайте.",
  },
  [Locale.EN]: {
    greeting: "Hello. To sign in to Hamroh AI, use the Telegram button on the website.",
    askContact: "You are signing in to Hamroh AI. Tap the button to confirm.",
    shareContact: "Share phone number",
    skipContact: "Continue without number",
    approved: "Sign-in confirmed. Return to your browser.",
    expired: "This code has expired. Get a new one on the website.",
    unknown: "Code not found. Get a new one on the website.",
  },
};
