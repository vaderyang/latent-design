/** PlainView — the DEFAULT, plain-language reading of a CognitiveState, written
 *  for a domain expert who is an AI novice. It reads like a smart colleague's
 *  note, not a diagnostic dashboard:
 *
 *    Your question  →  My read (+ word-level certainty)  →  Why I think so
 *    →  Where I changed my mind  →  What I'm unsure about  →  Ruled out  →  Next
 *
 *  All AI-insider vocabulary (grounded / hypothesis / provenance / verifiable /
 *  confidence 0.89) is translated to human words; visual weight is carried by
 *  whitespace and type, not borders / badges / mono instrument readings.
 *  Bilingual: chrome strings come from the i18n dictionary (English default). */
import { useState } from "react";
import type { CognitiveState, CognitiveNode, GroundedClaim, Hypothesis, Provenance } from "@latent/schema";
import { InterventionRail } from "./activity.tsx";
import type { InterventionAction } from "./activity.tsx";
import { useStrings, certaintyWord } from "../i18n.ts";
import type { Strings } from "../i18n.ts";

type Tone = "firm" | "lean" | "open" | "out";

function Certainty({ word, tone }: { word: string; tone: Tone }) {
  return (
    <span className={`certainty ${tone}`}>
      <span className="cdot" />
      {word}
    </span>
  );
}

function whyText(node: GroundedClaim | Hypothesis, t: Strings): string {
  const ev = node.evidence?.map((e) => e.label) ?? [];
  return ev.length ? t.plain.because(ev) : "";
}

/** "How I confirmed it" — provenance rendered as plain prose, certainty caveat folded. */
function HowIKnow({ provenance }: { provenance: Provenance }) {
  const t = useStrings();
  const [open, setOpen] = useState(false);
  const lines = provenance.steps.map((s) => s.observed);
  return (
    <>
      <span className="more" onClick={() => setOpen((o) => !o)}>
        {open ? t.plain.collapse : t.plain.howIKnow}
      </span>
      {open && (
        <div className="detail-open">
          {lines.map((l, i) => (
            <div key={i}>· {l}</div>
          ))}
          {provenance.mode === "verifiable" ? (
            <div style={{ marginTop: 6, color: "var(--grounded)" }}>{t.plain.verifiable}</div>
          ) : (
            <div style={{ marginTop: 6, color: "var(--ink-500)" }}>{t.plain.asserted}</div>
          )}
        </div>
      )}
    </>
  );
}

function Reason({ node }: { node: GroundedClaim | Hypothesis }) {
  const t = useStrings();
  const cert = certaintyWord(node.state, node.confidence.value, t);
  const why = whyText(node, t);
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
  visibleNodeIds,
  showOutcome = true,
  forming = false,
}: {
  state: CognitiveState;
  actions?: InterventionAction[];
  showProblem?: boolean;
  /** live playback: restrict to the nodes revealed so far */
  visibleNodeIds?: string[];
  /** live playback: hide the answer until it settles */
  showOutcome?: boolean;
  /** live playback: show a "still forming" placeholder where the answer will land */
  forming?: boolean;
}) {
  const t = useStrings();
  const nodes = visibleNodeIds ? state.nodes.filter((n) => visibleNodeIds.includes(n.id)) : state.nodes;
  const reasons = nodes.filter((n): n is GroundedClaim => n.state === "grounded");
  const uncertain = nodes.filter((n): n is Hypothesis => n.state === "hypothesis");
  const needs = nodes.filter((n) => n.state === "open");
  const ruledOut = nodes.filter((n) => n.state === "refuted");
  const changed = nodes.filter((n) => n.state === "inflection");

  // overall certainty = the certainty of the node the outcome points at
  const answerNode = state.outcome ? nodes.find((n) => n.id === state.outcome!.nodeId) : undefined;
  const answerCert =
    answerNode?.state === "grounded" || answerNode?.state === "hypothesis"
      ? certaintyWord(answerNode.state, (answerNode as GroundedClaim | Hypothesis).confidence.value, t)
      : t.certainty.initial;

  const story = state.userStory;
  const problem = story ? `${story.trigger ? story.trigger + t.plain.sentenceEnd : ""}${story.goal}` : state.task.goal;

  const [showOut, setShowOut] = useState(false);

  return (
    <div className="plain">
      {showProblem && problem && (
        <div className="p-sec">
          <div className="p-label">{t.plain.problem}</div>
          <div className="p-problem">{problem}</div>
        </div>
      )}

      {state.outcome && showOutcome && (
        <div className="p-sec p-answer-sec">
          <div className="p-label">
            {t.plain.judgement} <Certainty word={answerCert.word} tone={answerCert.tone} />
          </div>
          <div className="p-answer">{state.outcome.text}</div>
          {state.outcome.recommendation && (
            <div className="p-rec">
              {t.plain.suggestion}
              {state.outcome.recommendation}
            </div>
          )}
        </div>
      )}
      {state.outcome && !showOutcome && forming && (
        <div className="p-sec p-answer-sec">
          <div className="p-label">{t.plain.judgement}</div>
          <div className="p-forming">{t.live.formingAnswer}</div>
        </div>
      )}

      {reasons.length > 0 && (
        <div className="p-sec">
          <div className="p-label">{t.plain.why}</div>
          {reasons.map((n) => (
            <Reason key={n.id} node={n} />
          ))}
        </div>
      )}

      {changed.length > 0 && (
        <div className="p-sec">
          <div className="p-label">{t.plain.changedMind}</div>
          {changed.map((n) =>
            n.state === "inflection" ? (
              <div className="changed" key={n.id}>
                {t.plain.inflectBefore}
                <span className="old">{n.from}</span>
                {t.plain.inflectAfter}
                <span className="new">{n.to}</span>
                {t.plain.inflectEnd}
                {n.rationale}
              </div>
            ) : null,
          )}
        </div>
      )}

      {(uncertain.length > 0 || needs.length > 0) && (
        <div className="p-sec">
          <div className="p-label">{t.plain.unsure}</div>
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
            {showOut ? t.plain.collapse : t.plain.ruledOut(ruledOut.length)}
          </span>
          {showOut &&
            ruledOut.map((n) =>
              n.state === "refuted" ? (
                <div className="ruledout" key={n.id}>
                  <b>{n.title}</b>
                  {t.plain.ruledOutSep}
                  {n.reason}
                </div>
              ) : null,
            )}
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="p-sec p-actions-sec">
          <div className="p-label">{t.plain.nextYouCan}</div>
          <InterventionRail actions={actions} column={false} />
        </div>
      )}
    </div>
  );
}
