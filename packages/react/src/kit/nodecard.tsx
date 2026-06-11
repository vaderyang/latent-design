/** NodeCard — render any schema CognitiveNode through the kit's EpistemicCard /
 *  InflectionMark. This is the kit-skinned counterpart of CognitiveNodeView:
 *  one schema, two skins, one binding (fromSchema.ts). */
import type { CognitiveNode } from "@latent/schema";
import { EpistemicCard, InflectionMark } from "./semantic.tsx";
import { toConfidenceProps, toEvidenceItems, toProvenanceProps } from "./fromSchema.ts";
import { useStrings } from "../i18n.ts";

export function NodeCard({ node, className }: { node: CognitiveNode; className?: string }) {
  const t = useStrings();
  const badge = node.kind ? t.kind[node.kind] : undefined;

  switch (node.state) {
    case "inflection":
      return (
        <InflectionMark
          from={node.from}
          to={node.to}
          kind={node.inflectKind}
          rationale={node.rationale}
          className={className}
        />
      );
    case "grounded":
      return (
        <EpistemicCard
          state="grounded"
          title={node.title}
          badge={badge}
          confidence={toConfidenceProps(node.confidence)}
          evidence={toEvidenceItems(node.evidence)}
          provenance={toProvenanceProps(node.provenance)}
          className={className}
        />
      );
    case "hypothesis":
      return (
        <EpistemicCard
          state="hypothesis"
          title={node.title}
          badge={badge}
          confidence={toConfidenceProps(node.confidence)}
          evidence={toEvidenceItems(node.evidence)}
          falsification={node.falsification}
          provenance={node.provenance ? toProvenanceProps(node.provenance) : undefined}
          className={className}
        />
      );
    case "open":
      return (
        <EpistemicCard
          state="open"
          title={node.title}
          badge={badge}
          falsification={node.needs}
          falsificationLabel={t.open.toResolve}
          className={className}
        />
      );
    case "refuted":
      return (
        <EpistemicCard
          state="refuted"
          title={node.title}
          badge={badge}
          falsification={
            node.formerConfidence != null
              ? `${node.reason}${t.refuted.wasConf(node.formerConfidence.toFixed(2))}`
              : node.reason
          }
          falsificationLabel={t.refuted.whySank}
          className={className}
        />
      );
  }
}
