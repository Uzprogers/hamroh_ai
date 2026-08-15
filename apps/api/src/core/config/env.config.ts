import * as dotenv from "dotenv";
import * as path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../../../../.env") });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Muhit o'zgaruvchisi yo'q: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function toInt(name: string, fallback: string): number {
  return parseInt(optional(name, fallback), 10);
}

export const env = {
  db: { url: required("DATABASE_URL") },
  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: optional("JWT_EXPIRES_IN", "7d"),
  },
  llm: {
    apiKey: required("LLM_API_KEY"),
    model: optional("LLM_MODEL", "gemini-2.5-flash"),
    baseUrl: optional("LLM_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/"),
  },
  yandex: {
    keyPath: optional("YANDEX_SERVICE_ACCOUNT_KEY_PATH", ""),
    folderId: required("YX_FOLDER_ID"),
    ttsVoice: optional("YX_TTS_VOICE", "yulduz"),
    sttLanguage: optional("YX_STT_LANGUAGE", "uz-UZ"),
    ttsLanguage: optional("YX_TTS_LANGUAGE", "uz-UZ"),
    sttUrl: optional("YX_STT_URL", "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize"),
    ttsUrl: optional("YX_TTS_URL", "https://tts.api.cloud.yandex.net/tts/v3/utteranceSynthesis"),
  },
  google: {
    clientId: optional("GOOGLE_CLIENT_ID", ""),
  },
  telegram: {
    botToken: optional("TELEGRAM_BOT_TOKEN", ""),
    botUsername: optional("TELEGRAM_BOT_USERNAME", ""),
    loginTtlMs: toInt("TELEGRAM_LOGIN_TTL_MS", "300000"),
  },
  avatar: {
    provider: optional("AVATAR_PROVIDER", "canvas"),
    simliFaceId: optional("SIMLI_FACE_ID", ""),
  },
  server: {
    port: toInt("PORT", "3001"),
    nodeEnv: optional("NODE_ENV", "development"),
    webOrigins: optional("WEB_ORIGIN", "http://localhost:3000,http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    sessiyaTimeoutMs: toInt("SESSION_INACTIVITY_TIMEOUT_MS", "300000"),
  },
};
