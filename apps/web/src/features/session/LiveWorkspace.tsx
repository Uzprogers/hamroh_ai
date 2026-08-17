import { BuildingCard } from "./BuildingCard";
import { ExerciseRunner } from "./ExerciseRunner";
import { PanelCard } from "./PanelCard";
import { useI18n } from "../../i18n/i18n";
import type { SessionApi } from "./useSession";
import type { ExercisePayload } from "../../lib/types";

export function LiveWorkspace({ session }: { session: SessionApi }) {
  const { t } = useI18n();

  if (!session.panel.length) {
    return (
      <div className="surface grid min-h-[220px] place-items-center p-8 text-center text-sm text-muted">
        {t(session.connected ? "session.panel.empty" : "session.panel.start")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {session.panel.map((entry) => {
        if (!entry.payload) return <BuildingCard key={entry.callId} tool={entry.tool} />;

        if (entry.type === "EXERCISE") {
          return (
            <ExerciseRunner
              key={entry.callId}
              callId={entry.callId}
              payload={entry.payload as ExercisePayload}
              result={session.results[entry.callId] ?? null}
              busy={session.building}
              onSubmit={session.submitExercise}
            />
          );
        }

        return <PanelCard key={entry.callId} entry={entry} />;
      })}
    </div>
  );
}
