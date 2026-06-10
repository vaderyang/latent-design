/** The "stage" of an app — the agent's understanding as the lit primary plane.
 *  Validates the CognitiveState, then renders the embeddable UnderstandingPanel.
 *  Bilingual: pass English `data` + Chinese `dataZh`; picks per active language. */
import { CognitiveState } from "@latent/schema";
import { UnderstandingPanel, useLang } from "@latent/react";
import type { InterventionAction } from "@latent/react";

export default function StagePanel({
  data,
  dataZh,
  heading,
  headingZh,
  actions,
  actionsZh,
  live = true,
}: {
  data: unknown;
  dataZh?: unknown;
  heading?: string;
  headingZh?: string;
  actions?: InterventionAction[];
  actionsZh?: InterventionAction[];
  /** play the understanding forming (latent is a process) */
  live?: boolean;
}) {
  const zh = useLang() === "zh";
  const active = zh && dataZh ? dataZh : data;
  const head = (zh && headingZh) || heading;
  const acts = (zh && actionsZh) || actions;
  const parsed = CognitiveState.safeParse(active);
  if (!parsed.success) {
    return <div className="contract-error">✗ invalid CognitiveState</div>;
  }
  return <UnderstandingPanel state={parsed.data} heading={head ?? null} actions={acts} live={live} />;
}
