/** Scenario — a situated agent surface with three reading modes:
 *   • 简明 (Plain, DEFAULT) — plain-language note for a domain expert who is an
 *     AI novice: your question → my judgement → why → what I'm unsure about →
 *     what you can do. Calm, jargon-free.
 *   • 详细 (Detail) — the epistemic board (colors = states, confidence, evidence,
 *     provenance) for power users who want the machinery.
 *   • 开发者 (Trace) — the raw tool-call trace for builders / audit.
 *
 *  Default is 简明 because the earlier board was counter-intuitive and heavy for
 *  the target user. The agent advances on its own; the user reads + intervenes. */
import { useState } from "react";
import type { CognitiveState } from "@latent/schema";
import { UnderstandingSurface } from "./surface.tsx";
import { ActivityMini, InterventionRail, TraceView } from "./activity.tsx";
import type { InterventionAction } from "./activity.tsx";
import { OutcomeBanner } from "./panel.tsx";
import { PlainView } from "./plainview.tsx";

type View = "plain" | "detail" | "dev";

const DEFAULT_ACTIONS: InterventionAction[] = [
  { label: "采纳", variant: "primary" },
  { label: "提出异议" },
  { label: "补充目标 / 约束" },
];

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const opts: [View, string][] = [
    ["plain", "简明"],
    ["detail", "详细"],
    ["dev", "开发者"],
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
  return (
    <div className="story">
      <div className="story-head">
        <span className="who">{story.who}</span>
        {story.trigger && <span className="trig">触发 · {story.trigger}</span>}
      </div>
      <div className="goal">目标 · {story.goal}</div>
      <div className="story-rd">
        <div className="rd">
          <b>你在这里看到</b>
          {story.reads}
        </div>
        <div className="rd">
          <b>你在这里可做</b>
          {story.acts}
        </div>
      </div>
    </div>
  );
}

export function Scenario({
  state,
  stepped = false,
  actions = DEFAULT_ACTIONS,
  traceNote = "同一会话、同一真相，三种读法。简明给业务用户；详细给想看机制的人；开发者看执行与审计。",
}: {
  state: CognitiveState;
  /** in 详细 mode, offer a replay of how the understanding formed */
  stepped?: boolean;
  actions?: InterventionAction[];
  traceNote?: string;
}) {
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

      {/* 简明 — the plain-language default */}
      {view === "plain" && (
        <div className="sc-plain">
          <PlainView state={state} actions={actions} />
        </div>
      )}

      {/* 详细 — the epistemic board */}
      {view === "detail" && (
        <>
          {state.userStory && <UserStory story={state.userStory} />}
          <div className="sc-body">
            <div className="sc-understanding">
              <div className="ulabel">
                <span>① 理解态 · agent 当前的理解</span>
                {replaying && <span style={{ color: "var(--ink-500)" }}>回放 {cur} / {max}</span>}
              </div>
              {showOutcome && !replaying && <OutcomeBanner outcome={state.outcome!} />}
              <div key={replaying ? cur : "final"} className={replaying ? "step-in" : undefined}>
                <UnderstandingSurface state={state} visibleNodeIds={activeStep?.visibleNodeIds} />
              </div>
              {showOutcome && replaying && <OutcomeBanner outcome={state.outcome!} />}
              {canReplay && !replaying && (
                <div className="replay-cta">
                  <button onClick={() => { setCur(1); setReplaying(true); }}>▸ 回放：看这份理解如何一步步形成</button>
                  <span className="replay-note">演示用 · 真实使用中 agent 自动推进</span>
                </div>
              )}
              {replaying && (
                <div className="step-ctl">
                  <button onClick={() => setCur((c) => Math.max(1, c - 1))} disabled={cur === 1}>◂ 上一步</button>
                  <button onClick={() => setCur((c) => Math.min(max, c + 1))} disabled={cur === max}>下一步 ▸</button>
                  <button onClick={() => setReplaying(false)} title="回到最终结果">↺ 看完整结果</button>
                  <span className="prog">{cur} / {max}</span>
                  <span className="hint">{activeStep?.hint}</span>
                </div>
              )}
            </div>
            <div className="sc-rail">
              <div className="rlabel">② 动作流 · 外围（可审计）</div>
              <ActivityMini toolCalls={state.toolCalls} />
              <div className="rsub">③ 你可以做什么</div>
              <InterventionRail actions={actions} />
            </div>
          </div>
        </>
      )}

      {/* 开发者 — raw trace */}
      {view === "dev" && (
        <div className="dev-wrap">
          <TraceView toolCalls={state.toolCalls} note={traceNote} />
        </div>
      )}
    </div>
  );
}
