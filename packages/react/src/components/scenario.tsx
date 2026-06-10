/** Scenario — a situated agent surface with three reading modes:
 *   • Plain (DEFAULT) — plain-language note for a domain expert who is an AI
 *     novice: your question → my read → why → what I'm unsure about → what you
 *     can do. Calm, jargon-free.
 *   • Detail — the epistemic board (colors = states, confidence, evidence,
 *     provenance) for power users who want the machinery.
 *   • Developer — the raw tool-call trace for builders / audit.
 *
 *  Default is Plain because the earlier board was counter-intuitive and heavy
 *  for the target user. The agent advances on its own; the user reads +
 *  intervenes. Chrome strings are bilingual via the i18n dictionary. */
import { useState } from "react";
import type { CognitiveState } from "@latent/schema";
import { UnderstandingSurface } from "./surface.tsx";
import { ActivityMini, InterventionRail, TraceView } from "./activity.tsx";
import type { InterventionAction } from "./activity.tsx";
import { OutcomeBanner } from "./panel.tsx";
import { PlainView } from "./plainview.tsx";
import { useStrings } from "../i18n.ts";
import type { Strings } from "../i18n.ts";

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
  /** in Detail mode, offer a replay of how the understanding formed */
  stepped?: boolean;
  actions?: InterventionAction[];
  traceNote?: string;
}) {
  const t = useStrings();
  const acts = actions ?? defaultActions(t);
  const trace = traceNote ?? t.scenario.traceNote;
  const steps = state.steps ?? [];
  const canReplay = stepped && steps.length > 0;
  const [view, setView] = useState<View>("plain");
  const [replaying, setReplaying] = useState(false);
  const [cur, setCur] = useState(1);

  const max = steps.length;
  const stepIdx = Math.min(Math.max(cur, 1), Math.max(max, 1)) - 1;
  const activeStep = replaying ? steps[stepIdx] : undefined;
  const atEnd = cur >= max;
  const showOutcome = state.outcome && (!replaying || atEnd);

  return (
    <div className="scenario">
      <div className="sc-bar">
        <div className="inc">
          <div className="ttl">{state.task.title}</div>
          {(state.task.goal ?? state.task.context) && (
            <div className="meta">{state.task.goal ?? state.task.context}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {state.task.status && <span className="sev">{state.task.status}</span>}
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* Plain — the plain-language default */}
      {view === "plain" && (
        <div className="sc-plain">
          <PlainView state={state} actions={acts} />
        </div>
      )}

      {/* Detail — the epistemic board */}
      {view === "detail" && (
        <>
          {state.userStory && <UserStory story={state.userStory} />}
          <div className="sc-body">
            <div className="sc-understanding">
              <div className="ulabel">
                <span>{t.scenario.understandingLabel}</span>
                {replaying && <span style={{ color: "var(--ink-500)" }}>{t.scenario.replayCount(cur, max)}</span>}
              </div>
              {showOutcome && !replaying && <OutcomeBanner outcome={state.outcome!} />}
              <div key={replaying ? cur : "final"} className={replaying ? "step-in" : undefined}>
                <UnderstandingSurface state={state} visibleNodeIds={activeStep?.visibleNodeIds} />
              </div>
              {showOutcome && replaying && <OutcomeBanner outcome={state.outcome!} />}
              {canReplay && !replaying && (
                <div className="replay-cta">
                  <button onClick={() => { setCur(1); setReplaying(true); }}>{t.scenario.replayCta}</button>
                  <span className="replay-note">{t.scenario.replayNote}</span>
                </div>
              )}
              {replaying && (
                <div className="step-ctl">
                  <button onClick={() => setCur((c) => Math.max(1, c - 1))} disabled={cur === 1}>{t.scenario.prev}</button>
                  <button onClick={() => setCur((c) => Math.min(max, c + 1))} disabled={cur === max}>{t.scenario.next}</button>
                  <button onClick={() => setReplaying(false)} title={t.scenario.seeFullTitle}>{t.scenario.seeFull}</button>
                  <span className="prog">{cur} / {max}</span>
                  <span className="hint">{activeStep?.hint}</span>
                </div>
              )}
            </div>
            <div className="sc-rail">
              <div className="rlabel">{t.scenario.activityLabel}</div>
              <ActivityMini toolCalls={state.toolCalls} />
              <div className="rsub">{t.scenario.youCanDoShort}</div>
              <InterventionRail actions={acts} />
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
