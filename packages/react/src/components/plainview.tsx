/** PlainView — the DEFAULT, plain-language reading of a CognitiveState, written
 *  for a domain expert who is an AI novice. It reads like a smart colleague's
 *  note, not a diagnostic dashboard:
 *
 *    你的问题  →  我的判断 (+ 词级确定度)  →  我为什么这么看 (白话, 依据可折叠)
 *    →  我中途改了主意  →  我还不确定 / 需要你定  →  我考虑过但排除了  →  你可以做什么
 *
 *  All AI-insider vocabulary (grounded / hypothesis / provenance / verifiable /
 *  confidence 0.89) is translated to human words; visual weight is carried by
 *  whitespace and type, not borders / badges / mono instrument readings. */
import { useState } from "react";
import type { CognitiveState, CognitiveNode, GroundedClaim, Hypothesis, Provenance } from "@latent/schema";
import { InterventionRail } from "./activity.tsx";
import type { InterventionAction } from "./activity.tsx";

type Tone = "firm" | "lean" | "open" | "out";

function groundedCertainty(c: number): { word: string; tone: Tone } {
  if (c >= 0.85) return { word: "比较确定", tone: "firm" };
  if (c >= 0.7) return { word: "大致确定", tone: "firm" };
  return { word: "初步判断", tone: "lean" };
}
function hypoCertainty(c: number): { word: string; tone: Tone } {
  return c >= 0.5 ? { word: "倾向认为", tone: "lean" } : { word: "还在判断", tone: "lean" };
}

function Certainty({ word, tone }: { word: string; tone: Tone }) {
  return (
    <span className={`certainty ${tone}`}>
      <span className="cdot" />
      {word}
    </span>
  );
}

function whyText(node: GroundedClaim | Hypothesis): string {
  const ev = node.evidence?.map((e) => e.label) ?? [];
  return ev.length ? `因为${ev.join("；")}。` : "";
}

/** "我是怎么确认的" — provenance rendered as plain prose, certainty caveat folded. */
function HowIKnow({ provenance }: { provenance: Provenance }) {
  const [open, setOpen] = useState(false);
  const lines = provenance.steps.map((s) => s.observed);
  return (
    <>
      <span className="more" onClick={() => setOpen((o) => !o)}>
        {open ? "收起" : "我是怎么确认的 ▾"}
      </span>
      {open && (
        <div className="detail-open">
          {lines.map((l, i) => (
            <div key={i}>· {l}</div>
          ))}
          {provenance.mode === "verifiable" ? (
            <div style={{ marginTop: 6, color: "var(--grounded)" }}>这一条可以复核（有可重跑的验证）。</div>
          ) : (
            <div style={{ marginTop: 6, color: "var(--ink-500)" }}>这一条是我根据已有信息的判断，暂不能自动复核。</div>
          )}
        </div>
      )}
    </>
  );
}

function Reason({ node }: { node: GroundedClaim | Hypothesis }) {
  const cert = node.state === "grounded" ? groundedCertainty(node.confidence.value) : hypoCertainty(node.confidence.value);
  const why = whyText(node);
  return (
    <div className={`reason ${cert.tone}`}>
      <span className="rdot" />
      <div className="rbody">
        <div className="rtitle">
          {node.title} <Certainty word={cert.word} tone={cert.tone} />
        </div>
        {why && <div className="rwhy">{why}</div>}
        {node.state === "grounded" && <HowIKnow provenance={node.provenance} />}
      </div>
    </div>
  );
}

export function PlainView({
  state,
  actions,
  showProblem = true,
}: {
  state: CognitiveState;
  actions?: InterventionAction[];
  showProblem?: boolean;
}) {
  const nodes = state.nodes;
  const reasons = nodes.filter((n): n is GroundedClaim => n.state === "grounded");
  const uncertain = nodes.filter((n): n is Hypothesis => n.state === "hypothesis");
  const needs = nodes.filter((n) => n.state === "open");
  const ruledOut = nodes.filter((n) => n.state === "refuted");
  const changed = nodes.filter((n) => n.state === "inflection");

  // overall certainty = the certainty of the node the outcome points at
  const answerNode = state.outcome ? nodes.find((n) => n.id === state.outcome!.nodeId) : undefined;
  const answerCert =
    answerNode?.state === "grounded"
      ? groundedCertainty((answerNode as GroundedClaim).confidence.value)
      : answerNode?.state === "hypothesis"
        ? hypoCertainty((answerNode as Hypothesis).confidence.value)
        : { word: "初步", tone: "lean" as Tone };

  const story = state.userStory;
  const problem = story ? `${story.trigger ? story.trigger + "。" : ""}${story.goal}` : state.task.goal;

  const [showOut, setShowOut] = useState(false);

  return (
    <div className="plain">
      {showProblem && problem && (
        <div className="p-sec">
          <div className="p-label">你的问题</div>
          <div className="p-problem">{problem}</div>
        </div>
      )}

      {state.outcome && (
        <div className="p-sec p-answer-sec">
          <div className="p-label">
            我的判断 <Certainty word={answerCert.word} tone={answerCert.tone} />
          </div>
          <div className="p-answer">{state.outcome.text}</div>
          {state.outcome.recommendation && <div className="p-rec">→ 我的建议：{state.outcome.recommendation}</div>}
        </div>
      )}

      {reasons.length > 0 && (
        <div className="p-sec">
          <div className="p-label">我为什么这么看</div>
          {reasons.map((n) => (
            <Reason key={n.id} node={n} />
          ))}
        </div>
      )}

      {changed.length > 0 && (
        <div className="p-sec">
          <div className="p-label">我中途改了主意</div>
          {changed.map((n) =>
            n.state === "inflection" ? (
              <div className="changed" key={n.id}>
                原本以为<span className="old">{n.from}</span>，后来发现<span className="new">{n.to}</span>。{n.rationale}
              </div>
            ) : null,
          )}
        </div>
      )}

      {(uncertain.length > 0 || needs.length > 0) && (
        <div className="p-sec">
          <div className="p-label">我还不确定 / 需要你定</div>
          {uncertain.map((n) => (
            <div className="need lean" key={n.id}>
              <span className="rdot" />
              <div className="rbody">
                <div className="rtitle">{n.title}</div>
                <div className="rwhy">{n.falsification}</div>
              </div>
            </div>
          ))}
          {needs.map((n) =>
            n.state === "open" ? (
              <div className="need open" key={n.id}>
                <span className="rdot" />
                <div className="rbody">
                  <div className="rtitle">{n.title}</div>
                  <div className="rwhy">{n.needs}</div>
                </div>
              </div>
            ) : null,
          )}
        </div>
      )}

      {ruledOut.length > 0 && (
        <div className="p-sec">
          <span className="more" onClick={() => setShowOut((o) => !o)}>
            {showOut ? "收起" : `我考虑过但排除了 ${ruledOut.length} 个想法 ▾`}
          </span>
          {showOut &&
            ruledOut.map((n) =>
              n.state === "refuted" ? (
                <div className="ruledout" key={n.id}>
                  <b>{n.title}</b> —— {n.reason}
                </div>
              ) : null,
            )}
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="p-sec p-actions-sec">
          <div className="p-label">接下来你可以</div>
          <InterventionRail actions={actions} column={false} />
        </div>
      )}
    </div>
  );
}
