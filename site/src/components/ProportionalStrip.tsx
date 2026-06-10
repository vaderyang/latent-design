/** Live proportionality strip — the same design language at three epistemic
 *  complexities. Watch the understanding surface shrink to a single grounded
 *  line for a trivial task, and expand to a full board for a diagnosis. */
import { CognitiveState } from "@latent/schema";
import { ProportionalView, useLang } from "@latent/react";
import low from "@examples/proportionality/low.json";
import mid from "@examples/proportionality/mid.json";
import high from "@examples/proportionality/high.json";
import lowZh from "@examples/proportionality/low.zh.json";
import midZh from "@examples/proportionality/mid.zh.json";
import highZh from "@examples/proportionality/high.zh.json";

function Cell({ data, kind }: { data: unknown; kind: "low" | "mid" | "high" }) {
  const parsed = CognitiveState.safeParse(data);
  return (
    <div className={`prop-cell ${kind}`}>
      {parsed.success ? (
        <ProportionalView state={parsed.data} />
      ) : (
        <div className="contract-error">invalid</div>
      )}
    </div>
  );
}

export default function ProportionalStrip() {
  const zh = useLang() === "zh";
  return (
    <div className="prop-strip">
      <Cell data={zh ? lowZh : low} kind="low" />
      <Cell data={zh ? midZh : mid} kind="mid" />
      <Cell data={zh ? highZh : high} kind="high" />
    </div>
  );
}
