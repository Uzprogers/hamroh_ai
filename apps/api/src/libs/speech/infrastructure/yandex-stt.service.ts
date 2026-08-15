import { Injectable } from "@nestjs/common";
import { env } from "../../../core/config/env.config";
import { DEFAULT_LOCALE, Locale } from "../../../core/i18n/locale.enum";
import { SAMPLE_RATE, STT_LANGUAGE } from "../config/speech.config";
import { YandexIamService } from "./yandex-iam.service";

@Injectable()
export class YandexSttService {
  constructor(private readonly iam: YandexIamService) {}

  async recognize(audio: Buffer, locale: Locale = DEFAULT_LOCALE): Promise<string> {
    if (!audio.length) return "";

    const url = new URL(env.yandex.sttUrl);
    url.searchParams.set("folderId", env.yandex.folderId);
    url.searchParams.set("lang", STT_LANGUAGE[locale]);
    url.searchParams.set("format", "lpcm");
    url.searchParams.set("sampleRateHertz", String(SAMPLE_RATE));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.iam.getToken()}`,
        "content-type": "application/octet-stream",
      },
      body: new Uint8Array(audio),
    });

    if (!response.ok) throw new Error(`Yandex STT ${response.status}: ${await response.text()}`);

    const result = (await response.json()) as { result?: string };
    return result.result ?? "";
  }
}
