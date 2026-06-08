/** The "stage" of an app — the agent's understanding as the lit primary plane.
 *  Validates the CognitiveState, then renders the embeddable UnderstandingPanel. */
import { CognitiveState } from "@latent/schema";
import { UnderstandingPanel } from "@latent/react";
import type { InterventionAction } from "@latent/react";

export default function StagePanel({
  data,
  heading,
  actions,
}: {
  data: unknown;
  heading?: string;
  actions?: InterventionAction[];
}) {
  const parsed = CognitiveState.safeParse(data);
  if (!parsed.success) {
    return <div className="contract-error">✗ invalid CognitiveState</div>;
  }
  return <UnderstandingPanel state={parsed.data} heading={heading ?? null} actions={actions} />;
}
