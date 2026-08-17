import { BuildingCard } from "./BuildingCard";
import { ExerciseRunner } from "./ExerciseRunner";
import { PanelCard } from "./PanelCard";
import { WorkspaceIntro } from "./WorkspaceIntro";
import type { SessionApi } from "./useSession";
import type { ExercisePayload } from "../../lib/types";

export function LiveWorkspace({ session }: { session: SessionApi }) {
  if (!session.panel.length) return <WorkspaceIntro connected={session.connected} />;

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
