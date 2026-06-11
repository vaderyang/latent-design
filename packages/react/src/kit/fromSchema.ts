/** Schema → kit bindings. The schema layer renders THROUGH the kit rather
 *  than maintaining a parallel implementation: these converters are the one
 *  canonical mapping from CognitiveState sub-types to kit props.
 *
 *  Imports from @latent/schema are type-only, so the kit stays runtime-free
 *  of zod for schema-less consumers. */
import type { Confidence, Evidence, Provenance } from "@latent/schema";
import type { EvidenceItem, ProvenanceProps } from "./semantic.tsx";

/** The shared rendering of a Confidence source — never a vibe number. */
export const confidenceSourceLabel: Record<Confidence["source"], string> = {
  logprob: "logprob",
  self_consistency: "self-consist",
  self_report: "self-report",
  human: "human",
};

/** Evidence[] (schema) → EvidenceList items (kit). */
export function toEvidenceItems(evidence: Evidence[]): EvidenceItem[] {
  return evidence.map((e) => ({
    id: e.id,
    label: e.label,
    polarity: e.polarity,
    title: e.primitives.join(" · "),
  }));
}

/** Provenance (schema) → Provenance props (kit). */
export function toProvenanceProps(p: Provenance): ProvenanceProps {
  return {
    mode: p.mode,
    reExecCmd: p.reExecCmd,
    steps: p.steps.map((s) => ({ ref: s.toolCallId, observed: s.observed })),
  };
}

/** Confidence (schema) → EpistemicCard confidence prop (kit). */
export function toConfidenceProps(c: Confidence): { value: number; source: string } {
  return { value: c.value, source: confidenceSourceLabel[c.source] };
}
