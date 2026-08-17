import { Locale } from "../../../core/i18n/locale.enum";

export interface SpeechSegment {
  text: string;
  locale: Locale;
}

const QUOTED = /"([^"]+)"|«([^»]+)»|“([^”]+)”/g;
const TRIM_MARKS = /^[\s"'«»“”.,:;!?-]+|[\s"'«»“”:;,-]+$/g;

export function splitSpeech(text: string, base: Locale, target: Locale | null): SpeechSegment[] {
  const clean = text.trim();
  if (!clean) return [];
  if (!target || target === base) return [{ text: clean, locale: base }];

  const segments: SpeechSegment[] = [];
  let cursor = 0;

  for (const match of clean.matchAll(QUOTED)) {
    const quoted = match[1] ?? match[2] ?? match[3] ?? "";
    const start = match.index ?? 0;

    push(segments, clean.slice(cursor, start), base);
    push(segments, quoted, target);
    cursor = start + match[0].length;
  }

  push(segments, clean.slice(cursor), base);

  return segments.length ? segments : [{ text: clean, locale: base }];
}

function push(segments: SpeechSegment[], raw: string, locale: Locale): void {
  const text = raw.replace(TRIM_MARKS, "").trim();
  if (text) segments.push({ text, locale });
}
