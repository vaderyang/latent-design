/** The five cognitive-node cards. Each renders one legal epistemic state.
 *  Color encodes `state`; the badge text encodes the content `kind` (role)
 *  when present (decision / plan / requirement / option / answer / risk …),
 *  so one design language reads across every agent archetype. */
import type {
  CognitiveNode,
  GroundedClaim,
  Hypothesis,
  OpenQuestion,
  Inflection,
  Refuted,
  NodeKind,
} from "@latent/schema";
import { Badge, ConfidenceMeter, EvidenceChips, Falsification, ProvenanceView } from "./primitives.tsx";

const KIND_LABEL: Record<NodeKind, string> = {
  observation: "观察",
  claim: "论断",
  decision: "决定",
  plan: "计划",
  requirement: "需求",
  option: "选项",
  tradeoff: "权衡",
  answer: "回答",
  risk: "风险",
};

/** badge text = the content role if given, else the epistemic-state word. */
function roleLabel(kind: NodeKind | undefined, fallback: string): string {
  return kind ? KIND_LABEL[kind] : fallback;
}

export function GroundedClaimCard({ node }: { node: GroundedClaim }) {
  return (
    <div className="hcard grounded">
      <div className="hhead">
        <div className="htitle">{node.title}</div>
        <Badge tone="g">{roleLabel(node.kind, "Grounded")}</Badge>
      </div>
      <ConfidenceMeter confidence={node.confidence} tone="g" />
      <EvidenceChips evidence={node.evidence} />
      <ProvenanceView provenance={node.provenance} />
    </div>
  );
}

export function HypothesisCard({ node }: { node: Hypothesis }) {
  return (
    <div className="hcard hypo">
      <div className="hhead">
        <div className="htitle">{node.title}</div>
        <Badge tone="h">{roleLabel(node.kind, "Hypothesis")}</Badge>
      </div>
      <ConfidenceMeter confidence={node.confidence} tone="h" />
      <EvidenceChips evidence={node.evidence} />
      <Falsification text={node.falsification} tone="h" />
      {node.provenance && <ProvenanceView provenance={node.provenance} />}
    </div>
  );
}

export function OpenQuestionCard({ node }: { node: OpenQuestion }) {
  return (
    <div className="hcard" style={{ borderColor: "var(--open-line)" }}>
      <div className="hhead">
        <div className="htitle" style={{ fontStyle: "italic" }}>
          {node.title}
        </div>
        <Badge tone="o">{roleLabel(node.kind, "Open")}</Badge>
      </div>
      <Falsification text={node.needs} label="待解决" tone="o" />
    </div>
  );
}

const INFLECT_KIND: Record<Inflection["inflectKind"], string> = {
  backtrack: "回退",
  aha: "啊哈",
  refutation: "推翻",
};

export function InflectionMarker({ node }: { node: Inflection }) {
  return (
    <div className="inflect-mark">
      <div className="it">Inflection · 拐点 / {INFLECT_KIND[node.inflectKind]}</div>
      <div className="body">
        <span className="from">{node.from}</span> → <span className="to">{node.to}</span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: 8, fontFamily: "var(--ui)" }}>
        {node.rationale}
      </div>
    </div>
  );
}

export function RefutedCard({ node }: { node: Refuted }) {
  return (
    <div className="hcard refuted">
      <div className="hhead">
        <div className="htitle">{node.title}</div>
        <Badge tone="r">{roleLabel(node.kind, "Refuted")}</Badge>
      </div>
      <Falsification
        text={
          node.formerConfidence != null
            ? `${node.reason}（曾 conf ${node.formerConfidence.toFixed(2)}）`
            : node.reason
        }
        label="为何沉降"
        tone="r"
      />
    </div>
  );
}

/** Dispatch a node to its card by epistemic state. */
export function CognitiveNodeView({ node }: { node: CognitiveNode }) {
  switch (node.state) {
    case "grounded":
      return <GroundedClaimCard node={node} />;
    case "hypothesis":
      return <HypothesisCard node={node} />;
    case "open":
      return <OpenQuestionCard node={node} />;
    case "inflection":
      return <InflectionMarker node={node} />;
    case "refuted":
      return <RefutedCard node={node} />;
  }
}

export { KIND_LABEL };
