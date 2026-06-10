/**
 * @latent/react — schema-driven React components for the Latent · 潜 design language.
 *
 * Import the styles once in your app (alongside @latent/tokens/css):
 *   import "@latent/tokens/css";
 *   import "@latent/react/styles";
 *
 * Every component's props are z.infer<> of a @latent/schema sub-type, so the
 * rendered UI and the model's emit-target share one contract.
 */
export { Badge, ConfidenceMeter, EvidenceChips, Falsification, ProvenanceView } from "./components/primitives.tsx";
export {
  GroundedClaimCard,
  HypothesisCard,
  OpenQuestionCard,
  InflectionMarker,
  RefutedCard,
  CognitiveNodeView,
} from "./components/nodes.tsx";
export {
  ActivityStream,
  ActivityMini,
  TraceView,
  InterventionRail,
  PersonaToggle,
} from "./components/activity.tsx";
export type { InterventionAction } from "./components/activity.tsx";
export { UnderstandingSurface, ProportionalView, orderNodes } from "./components/surface.tsx";
export { UnderstandingPanel, OutcomeBanner } from "./components/panel.tsx";
export { PlainView } from "./components/plainview.tsx";
export { Scenario } from "./components/scenario.tsx";

// Bilingual (English default · 中文) chrome strings + reactive language hook.
export { useLang, getLang, useStrings, STRINGS, LANG_EVENT } from "./i18n.ts";
export type { Lang, Strings } from "./i18n.ts";

// Re-export the schema types for convenience.
export type {
  CognitiveState,
  CognitiveNode,
  GroundedClaim,
  Hypothesis,
  OpenQuestion,
  Inflection,
  Refuted,
} from "@latent/schema";
