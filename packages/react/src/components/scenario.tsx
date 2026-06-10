/** Scenario — a situated agent surface with three reading modes:
 *   • Plain (DEFAULT) — plain-language note for a domain expert who is an AI
 *     novice: your question → my read → why → what I'm unsure about → what you
 *     can do. Calm, jargon-free.
 *   • Detail — the epistemic board (colors = states, confidence, evidence,
 *     provenance) for power users who want the machinery.
 *   • Developer — the raw tool-call trace for builders / audit.
 *
 *  LATENT IS A PROCESS: when the state carries `steps`, the surface plays the
 *  understanding FORMING — nodes surface phase by phase, the answer holds a
 *  "still forming" slot until it settles, tool calls stream into the rail.
 *  Playback starts in view; ⏸/↻/⏭ in the bar; reduced-motion lands settled. */
import { useState } from "react";
import type { CognitiveState } from "@latent/schema";
import { UnderstandingSurface } from "./surface.tsx";
import { ActivityMini, InterventionRail, TraceView } from "./activity.tsx";
import type { InterventionAction } from "./activity.tsx";
import { OutcomeBanner } from "./panel.tsx";
import { PlainView } from "./plainview.tsx";
import { useStrings } from "../i18n.ts";
import type { Strings } from "../i18n.ts";
import { useLatentClock, LiveControls } from "../live.tsx";

type View = "plain" | "detail" | "dev";

function defaultActions(t: Strings): InterventionAction[] {
  return [
    { label: t.scenario.accept, variant: "primary" },
    { label: t.scenario.pushback },
    { label: t.scenario.addConstraint },
  ];
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const t = useStrings();
  const opts: [View, string][] = [
    ["plain", t.scenario.viewPlain],
    ["detail", t.scenario.viewDetail],
    ["dev", t.scenario.viewDev],
  ];
  return (
    <div className="modes">
      {opts.map(([v, label]) => (
        <button key={v} className={`mode-btn${view === v ? " active" : ""}`} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function UserStory({ story }: { story: NonNullable<CognitiveState["userStory"]> }) {
  const t = useStrings();
  return (
    <div className="story">
      <div className="story-head">
        <span className="who">{story.who}</span>
        {story.trigger && (
          <span className="trig">
            {t.scenario.triggerLabel}
            {story.trigger}
          </span>
        )}
      </div>
      <div className="goal">
        {t.scenario.goalLabel}
        {story.goal}
      </div>
      <div className="story-rd">
        <div className="rd">
          <b>{t.scenario.youSee}</b>
          {story.reads}
        </div>
        <div className="rd">
          <b>{t.scenario.youCanDo}</b>
          {story.acts}
        </div>
      </div>
    </div>
  );
}

export function Scenario({
  state,
  stepped = false,
  actions,
  traceNote,
}: {
  state: CognitiveState;
  /** play the formation of the understanding (requires state.steps) */
  stepped?: boolean;
  actions?: InterventionAction[];
  traceNote?: string;
}) {
  const t = useStrings();
  const acts = actions ?? defaultActions(t);
  const trace = traceNote ?? t.scenario.traceNote;
  const [view, setView] = useState<View>("plain");

  const clockState = useLatentClock(state, stepped);
  const { done, stepIdx, visibleNodeIds, toolCallCount } = clockState;
  const steps = state.steps ?? [];
  const live = stepped && steps.length > 0;
  const phaseLabel = steps[stepIdx]?.label;

  return (
    <div className="scenario" ref={clockState.ref}>
      <div className="sc-bar">
        <div className="inc">
          <div className="ttl">{state.task.title}</div>
          {(state.task.goal ?? state.task.context) && (
            <div className="meta">{state.task.goal ?? state.task.context}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {live && <LiveControls clockState={clockState} label={phaseLabel} />}
          {state.task.status && <span className="sev">{state.task.status}</span>}
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* Plain — the plain-language default; the answer forms, then settles */}
      {view === "plain" && (
        <div className="sc-plain">
          <PlainView
            state={state}
            actions={done ? acts : undefined}
            visibleNodeIds={visibleNodeIds}
            showOutcome={done}
            forming={live && !done}
          />
        </div>
      )}

      {/* Detail — the epistemic board, surfacing phase by phase */}
      {view === "detail" && (
        <>
          {state.userStory && <UserStory story={state.userStory} />}
          <div className="sc-body">
            <div className="sc-understanding">
              <div className="ulabel">
                <span>{t.scenario.understandingLabel}</span>
                {live && !done && steps[stepIdx]?.hint && (
                  <span className="uhint">{steps[stepIdx]?.hint}</span>
                )}
              </div>
              {done && state.outcome && <OutcomeBanner outcome={state.outcome} />}
              <UnderstandingSurface state={state} visibleNodeIds={visibleNodeIds} />
            </div>
            <div className="sc-rail">
              <div className="rlabel">{t.scenario.activityLabel}</div>
              <ActivityMini toolCalls={state.toolCalls.slice(0, toolCallCount)} />
              {done && (
                <>
                  <div className="rsub">{t.scenario.youCanDoShort}</div>
                  <InterventionRail actions={acts} />
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Developer — raw trace */}
      {view === "dev" && (
        <div className="dev-wrap">
          <TraceView toolCalls={state.toolCalls} note={trace} />
        </div>
      )}
    </div>
  );
}
