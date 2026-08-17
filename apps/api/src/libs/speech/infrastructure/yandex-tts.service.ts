import { Injectable, Logger } from "@nestjs/common";
import { env } from "../../../core/config/env.config";
import { DEFAULT_LOCALE, Locale } from "../../../core/i18n/locale.enum";
import { SAMPLE_RATE, TTS_VOICE } from "../config/speech.config";
import { YandexIamService } from "./yandex-iam.service";

export type AudioFormat = "ogg" | "pcm";

@Injectable()
export class YandexTtsService {
  private readonly logger = new Logger(YandexTtsService.name);

  constructor(private readonly iam: YandexIamService) {}

  async synthesize(
    text: string,
    locale: Locale = DEFAULT_LOCALE,
    format: AudioFormat = "pcm",
  ): Promise<Buffer> {
    const outputAudioSpec =
      format === "pcm"
        ? { rawAudio: { audioEncoding: "LINEAR16_PCM", sampleRateHertz: SAMPLE_RATE } }
        : { containerAudio: { containerAudioType: "OGG_OPUS" } };

    const response = await fetch(env.yandex.ttsUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.iam.getToken()}`,
        "content-type": "application/json",
        "x-folder-id": env.yandex.folderId,
      },
      body: JSON.stringify({
        text,
        outputAudioSpec,
        hints: [{ voice: TTS_VOICE[locale] }, { role: "neutral" }],
        loudnessNormalizationType: "LUFS",
      }),
    });

    if (!response.ok) throw new Error(`Yandex TTS ${response.status}: ${await response.text()}`);

    const chunks: Buffer[] = [];
    for (const line of (await response.text()).split("\n")) {
      if (!line.trim()) continue;
      try {
        const data = (JSON.parse(line) as { result?: { audioChunk?: { data?: string } } })?.result
          ?.audioChunk?.data;
        if (data) chunks.push(Buffer.from(data, "base64"));
      } catch {
        this.logger.warn("Skipped non-JSON line in TTS response");
      }
    }

    if (!chunks.length) throw new Error("TTS_EMPTY_RESPONSE");
    return Buffer.concat(chunks);
  }
}
