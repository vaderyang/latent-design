/** Embeddable understanding plane for product UIs. By default it renders the
 *  plain-language reading (for AI-novice domain experts); pass variant="board"
 *  for the dense epistemic view. Drop into the "stage" zone of any app. */
import type { CognitiveState } from "@latent/schema";
import { UnderstandingSurface } from "./surface.tsx";
import { InterventionRail } from "./activity.tsx";
import type { InterventionAction } from "./activity.tsx";
import { PlainView } from "./plainview.tsx";
import { useStrings } from "../i18n.ts";
import { useLatentClock, LiveControls } from "../live.tsx";

export function OutcomeBanner({ outcome }: { outcome: NonNullable<CognitiveState["outcome"]> }) {
  const t = useStrings();
  return (
    <div className="conclusion">
      <div className="cl">◆ {outcome.label ?? t.panel.outcome}</div>
      <div className="ctext">
        {outcome.text}
        {outcome.recommendation && (
          <>
            {t.panel.suggestion}
            {outcome.recommendation}
          </>
        )}
      </div>
    </div>
  );
}

export function UnderstandingPanel({
  state,
  actions,
  variant = "plain",
  outcomeFirst = true,
  intervene = true,
  heading = null,
  showProblem = true,
  live = false,
}: {
  state: CognitiveState;
  actions?: InterventionAction[];
  variant?: "plain" | "board";
  outcomeFirst?: boolean;
  intervene?: boolean;
  heading?: string | null;
  showProblem?: boolean;
  /** play the understanding forming (requires state.steps) */
  live?: boolean;
}) {
  const t = useStrings();
  const clockState = useLatentClock(state, live && variant === "plain");
  const playingLive = live && variant === "plain" && (state.steps?.length ?? 0) > 0;
  const { done, visibleNodeIds, stepIdx } = clockState;
  return (
    <div className="upanel" ref={clockState.ref}>
      {(heading || playingLive) && (
        <div className="upanel-head" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <span>{heading ? `① ${heading}` : ""}</span>
          {playingLive && <LiveControls clockState={clockState} label={state.steps?.[stepIdx]?.label} />}
        </div>
      )}
      {variant === "plain" ? (
        <PlainView
          state={state}
          actions={intervene && (!playingLive || done) ? actions : undefined}
          showProblem={showProblem}
          visibleNodeIds={playingLive ? visibleNodeIds : undefined}
          showOutcome={!playingLive || done}
          forming={playingLive && !done}
        />
      ) : (
        <>
          {outcomeFirst && state.outcome && <OutcomeBanner outcome={state.outcome} />}
          <UnderstandingSurface state={state} />
          {intervene && actions && actions.length > 0 && (
            <div className="upanel-act">
              <div className="rsub">{t.panel.youCanDo}</div>
              <InterventionRail actions={actions} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
