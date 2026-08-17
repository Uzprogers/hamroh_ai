import { useI18n } from "../../i18n/i18n";
import type {
  ExercisePayload,
  MistakesPayload,
  PanelCardType,
  ResultsPayload,
  SpeakingPayload,
  StudyPlanPayload,
  TopicRecapPayload,
} from "../../lib/types";
import type { TranslationKey } from "../../i18n/dictionary";

export interface PanelEntry {
  callId: string;
  tool: string;
  type: PanelCardType | null;
  payload: unknown;
}

const TOOL_TO_TYPE: Record<string, PanelCardType> = {
  get_results: "RESULTS",
  get_mistakes: "MISTAKES",
  create_exercise: "EXERCISE",
  review_speaking: "SPEAKING_REVIEW",
  study_plan: "STUDY_PLAN",
  explain_topic: "TOPIC_RECAP",
};

export function toolCardType(tool: string): PanelCardType | null {
  return TOOL_TO_TYPE[tool] ?? null;
}

export function PanelCard({ entry }: { entry: PanelEntry }) {
  const { t } = useI18n();
  const type = entry.type ?? toolCardType(entry.tool);
  const title = type ? t(`card.${type}` as TranslationKey) : entry.tool;

  return (
    <article className="surface animate-rise overflow-hidden p-5">
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-paper/90">{title}</h3>
        {!entry.payload && <span className="text-xs text-muted">{t("card.building")}</span>}
      </header>

      <div className="mt-4">{entry.payload ? renderBody(type, entry.payload, t) : <Skeleton />}</div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  );
}

function renderBody(
  type: PanelCardType | null,
  payload: unknown,
  t: (key: TranslationKey) => string,
) {
  switch (type) {
    case "RESULTS":
      return <Results payload={payload as ResultsPayload} t={t} />;
    case "MISTAKES":
      return <Mistakes payload={payload as MistakesPayload} />;
    case "EXERCISE":
      return <Exercise payload={payload as ExercisePayload} t={t} />;
    case "SPEAKING_REVIEW":
      return <Speaking payload={payload as SpeakingPayload} t={t} />;
    case "STUDY_PLAN":
      return <StudyPlan payload={payload as StudyPlanPayload} t={t} />;
    case "TOPIC_RECAP":
      return <TopicRecap payload={payload as TopicRecapPayload} t={t} />;
    default:
      return null;
  }
}

function Results({ payload, t }: { payload: ResultsPayload; t: (key: TranslationKey) => string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="font-display text-3xl font-extrabold brand-text">{payload.average_percent}%</div>
        <span className="text-xs text-muted">{t("card.averageScore")}</span>
      </div>
      <div className="space-y-2">
        {payload.items.slice(0, 4).map((item) => (
          <div key={item.submission_id} className="rounded-lg border border-edge/60 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm">{item.lesson_topic}</span>
              <span className="font-mono text-xs text-teal">
                {item.score ?? "—"}/{item.max_score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Mistakes({ payload }: { payload: MistakesPayload }) {
  return (
    <div className="space-y-2">
      {payload.items.slice(0, 5).map((mistake, index) => (
        <div key={index} className="rounded-lg border border-edge/60 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded bg-coral/15 px-2 py-0.5 text-coral line-through">{mistake.fragment}</span>
            <span className="text-muted">→</span>
            <span className="rounded bg-teal/15 px-2 py-0.5 text-teal">{mistake.correction}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{mistake.explanation}</p>
        </div>
      ))}
    </div>
  );
}

function Exercise({ payload, t }: { payload: ExercisePayload; t: (key: TranslationKey) => string }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="font-semibold">{payload.title}</div>
        <p className="mt-1 text-sm text-muted">{payload.instruction}</p>
      </div>
      <ol className="space-y-2">
        {payload.items?.map((item, index) => (
          <li key={index} className="rounded-lg border border-edge/60 px-3 py-2">
            <div className="flex gap-2 text-sm">
              <span className="font-mono text-xs text-azure">{index + 1}</span>
              <span>{item.prompt}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted">
              <span>
                {t("card.answer")}: <span className="text-teal">{item.answer}</span>
              </span>
              {item.hint && (
                <span>
                  {t("card.hint")}: {item.hint}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Speaking({ payload, t }: { payload: SpeakingPayload; t: (key: TranslationKey) => string }) {
  return (
    <div className="space-y-4">
      <p className="flex flex-wrap gap-1.5 text-sm leading-7">
        {payload.segments?.map((segment, index) => (
          <span
            key={index}
            className={
              segment.correct
                ? "rounded bg-edge/40 px-1.5"
                : "rounded bg-coral/15 px-1.5 text-coral underline decoration-coral/60 decoration-wavy underline-offset-4"
            }
            title={segment.note}
          >
            {segment.fragment}
          </span>
        ))}
      </p>

      <div className="rounded-lg border border-teal/30 bg-teal/5 px-3 py-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("card.corrected")}</div>
        <p className="mt-1 text-sm text-teal">{payload.corrected}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal to-azure transition-[width] duration-700"
            style={{ width: `${payload.score ?? 0}%` }}
          />
        </div>
        <span className="font-mono text-xs">{payload.score ?? 0}%</span>
      </div>
    </div>
  );
}

function TopicRecap({
  payload,
  t,
}: {
  payload: TopicRecapPayload;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-start font-display text-base font-extrabold">{payload.title}</div>
        <p className="mt-1 text-start text-sm text-muted">{payload.summary}</p>
      </div>

      <ol className="space-y-2.5">
        {payload.steps?.map((step, index) => (
          <li key={index} className="rounded-xl border border-edge/60 px-3 py-2.5">
            <div className="flex gap-3">
              <span className="font-mono text-xs text-teal">0{index + 1}</span>
              <div className="min-w-0">
                <div className="text-start text-sm font-semibold">{step.title}</div>
                <p className="mt-1 text-start text-sm text-muted">{step.text}</p>
                {step.example && (
                  <p className="mt-1.5 rounded-lg bg-teal/10 px-2.5 py-1.5 text-start text-sm text-teal">
                    {step.example}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {payload.check && (
        <div className="rounded-xl border border-azure/35 bg-azure/5 px-3 py-2.5">
          <div className="text-start text-xs font-semibold uppercase tracking-wide text-muted">
            {t("card.check")}
          </div>
          <p className="mt-1 text-start text-sm">{payload.check}</p>
        </div>
      )}
    </div>
  );
}

function StudyPlan({ payload, t }: { payload: StudyPlanPayload; t: (key: TranslationKey) => string }) {
  return (
    <ol className="space-y-2">
      {payload.days?.map((day) => (
        <li key={day.day} className="flex gap-3 rounded-lg border border-edge/60 px-3 py-2">
          <span className="font-mono text-xs text-azure">
            {day.day} {t("card.day")}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{day.focus}</div>
            <p className="text-xs text-muted">{day.task}</p>
          </div>
          <span className="ml-auto shrink-0 text-xs text-muted">
            {day.minutes} {t("card.minutes")}
          </span>
        </li>
      ))}
    </ol>
  );
}
