import type { TranslationKey } from "../i18n/dictionary";

export type PreviewMetric = {
  labelKey: TranslationKey;
  value: number;
};

export type PreviewScenario = {
  id: string;
  levelKey: TranslationKey;
  tabKey: TranslationKey;
  subjectKey: TranslationKey;
  topicKey: TranslationKey;
  taskKey: TranslationKey;
  answerKey: TranslationKey;
  feedbackKey: TranslationKey;
  monospace: boolean;
  score: number;
  seconds: number;
  metrics: PreviewMetric[];
};
