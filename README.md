# Hamroh AI

O'qituvchining tekshiruv vaqtini qaytaradigan va o'quvchi bilan jonli ovozda gaplashadigan AI hamroh.
Umummilliy AI Xakaton — Qarshi bosqichi, ta'lim treki, muammo #2.

## Nima qiladi

1. **Ustoz** mavzuni kiritadi → AI dars rejasi va topshiriqlarni yaratadi
2. **O'quvchi** topshiriqni bajaradi → AI rubrika bo'yicha baholaydi, xatolarni tuzatib ko'rsatadi
3. **Jonli sessiya** — chapda 3D avatar gapiradi, o'ngda agent natijalarni real vaqtda quradi
4. **Ustoz** sinf kesimida analitikani ko'radi va AI bahosini tasdiqlaydi

## Stack

| Qatlam | Texnologiya |
|---|---|
| Backend | NestJS (DDD), TypeORM, PostgreSQL, Socket.IO |
| Frontend | React 19, Vite, TypeScript, Tailwind, three.js |
| Nutq | Yandex SpeechKit — STT (uz/ru/en) + TTS v3 (`yulduz` / `alena` / `john`) |
| Fikrlash | Gemini 2.5 Flash (OpenAI-mos API), function calling |

Uch til: o'zbek, rus, ingliz — interfeys, AI javoblari va avatar ovozi bir vaqtda o'zgaradi.

## Ishga tushirish

```bash
cp .env.example .env        # kalitlarni to'ldiring
createdb hamroh_ai
npm install
npm run migration:run
npm run seed                # demo ustoz, 6 o'quvchi, AI yaratgan dars va baholar
npm run api                 # http://localhost:3001
npm run web                 # http://localhost:3000
```

Demo hisoblar: ustoz `+998901112233 / hamroh2026`, o'quvchi `+998900000001 / student123`.

## Arxitektura

```
apps/api/src/libs/
  identity/    JWT auth, foydalanuvchi, til
  education/   guruh · dars · topshiriq · javob · baho · analitika
  agent/       LLM (stream + function calling + JSON rejim)
  speech/      Yandex IAM · STT · TTS
  session/     WS gateway · pipeline · agent tool'lari
```

Ovoz zanjiri: mikrofon → PCM 16 kHz → WS → STT → LLM (tool'lar bilan) → TTS → brauzer.
Yandex xizmat akkaunti kaliti faqat serverda; IAM token 50 daqiqada avtomatik yangilanadi.
