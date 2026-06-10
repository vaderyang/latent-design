/** The five cognitive-node cards. Each renders one legal epistemic state.
 *  Color encodes `state`; the badge text encodes the content `kind` (role)
 *  when present (decision / plan / requirement / option / answer / risk …),
 *  so one design language reads across every agent archetype.
 *  Badge / marker words are bilingual via the i18n dictionary. */
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
import { useStrings } from "../i18n.ts";
import type { Strings } from "../i18n.ts";

/** badge text = the content role if given, else the epistemic-state word. */
function roleLabel(kind: NodeKind | undefined, fallback: string, t: Strings): string {
  return kind ? t.kind[kind] : fallback;
}

export function GroundedClaimCard({ node }: { node: GroundedClaim }) {
  const t = useStrings();
  return (
    <div className="hcard grounded">
      <div className="hhead">
        <div className="htitle">{node.title}</div>
        <Badge tone="g">{roleLabel(node.kind, t.state.grounded, t)}</Badge>
      </div>
      <ConfidenceMeter confidence={node.confidence} tone="g" />
      <EvidenceChips evidence={node.evidence} />
      <ProvenanceView provenance={node.provenance} />
    </div>
  );
}

export function HypothesisCard({ node }: { node: Hypothesis }) {
  const t = useStrings();
  return (
    <div className="hcard hypo">
      <div className="hhead">
        <div className="htitle">{node.title}</div>
        <Badge tone="h">{roleLabel(node.kind, t.state.hypothesis, t)}</Badge>
      </div>
      <ConfidenceMeter confidence={node.confidence} tone="h" />
      <EvidenceChips evidence={node.evidence} />
      <Falsification text={node.falsification} tone="h" />
      {node.provenance && <ProvenanceView provenance={node.provenance} />}
    </div>
  );
}

export function OpenQuestionCard({ node }: { node: OpenQuestion }) {
  const t = useStrings();
  return (
    <div className="hcard" style={{ borderColor: "var(--open-line)" }}>
      <div className="hhead">
        <div className="htitle" style={{ fontStyle: "italic" }}>
          {node.title}
        </div>
        <Badge tone="o">{roleLabel(node.kind, t.state.open, t)}</Badge>
      </div>
      <Falsification text={node.needs} label={t.open.toResolve} tone="o" />
    </div>
  );
}

export function InflectionMarker({ node }: { node: Inflection }) {
  const t = useStrings();
  return (
    <div className="inflect-mark">
      <div className="it">{t.inflect.prefix}{t.inflect[node.inflectKind]}</div>
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
  const t = useStrings();
  return (
    <div className="hcard refuted">
      <div className="hhead">
        <div className="htitle">{node.title}</div>
        <Badge tone="r">{roleLabel(node.kind, t.state.refuted, t)}</Badge>
      </div>
      <Falsification
        text={node.formerConfidence != null ? `${node.reason}${t.refuted.wasConf(node.formerConfidence.toFixed(2))}` : node.reason}
        label={t.refuted.whySank}
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
