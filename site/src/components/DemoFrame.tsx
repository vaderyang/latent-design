/**
 * DemoFrame — the bridge from a CognitiveState JSON instance to rendered UI.
 * Validates against the contract first; a green render is itself proof that the
 * schema, the example, and the component library all agree.
 *
 * Bilingual: pass the English `data` and the matching Chinese `dataZh`; the
 * frame picks per the active language (English default).
 */
import { CognitiveState } from "@latent/schema";
import { Scenario, ProportionalView, useLang } from "@latent/react";

export default function DemoFrame({
  data,
  dataZh,
  mode = "scenario",
  stepped = true,
}: {
  data: unknown;
  dataZh?: unknown;
  mode?: "scenario" | "proportional";
  stepped?: boolean;
}) {
  const lang = useLang();
  const active = lang === "zh" && dataZh ? dataZh : data;
  const parsed = CognitiveState.safeParse(active);
  if (!parsed.success) {
    return (
      <div className="contract-error">
        <b>✗ Grounding Contract violation — this instance does not validate</b>
        {parsed.error.issues.map((i, k) => (
          <div key={k}>
            {i.path.join(".") || "(root)"} — {i.message}
          </div>
        ))}
      </div>
    );
  }
  const state = parsed.data;
  return mode === "proportional" ? (
    <ProportionalView state={state} />
  ) : (
    <Scenario state={state} stepped={stepped} />
  );
}
