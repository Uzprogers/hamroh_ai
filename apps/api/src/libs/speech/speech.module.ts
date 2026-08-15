import { Module } from "@nestjs/common";
import { YandexIamService } from "./infrastructure/yandex-iam.service";
import { YandexSttService } from "./infrastructure/yandex-stt.service";
import { YandexTtsService } from "./infrastructure/yandex-tts.service";

@Module({
  providers: [YandexIamService, YandexSttService, YandexTtsService],
  exports: [YandexSttService, YandexTtsService],
})
export class SpeechModule {}
