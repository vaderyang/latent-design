/** Understanding Surface — the persistent, primary plane of cognition. */
import type { CognitiveState, CognitiveNode, EpistemicState } from "@latent/schema";
import { CognitiveNodeView, GroundedClaimCard } from "./nodes.tsx";
import { useStrings } from "../i18n.ts";

/** Surface priority: inflections rise, refuted sinks. (Principle 03 + the sink discipline.) */
const PRIORITY: Record<EpistemicState, number> = {
  inflection: 0,
  grounded: 1,
  hypothesis: 2,
  open: 3,
  refuted: 4,
};

/** Order nodes by epistemic priority, preserving source order within a tier. */
export function orderNodes(nodes: CognitiveNode[]): CognitiveNode[] {
  return nodes
    .map((n, i) => ({ n, i }))
    .sort((a, b) => PRIORITY[a.n.state] - PRIORITY[b.n.state] || a.i - b.i)
    .map((x) => x.n);
}

/**
 * Renders a set of cognitive nodes as the Understanding Surface.
 * `visibleNodeIds` (optional) filters to a step's subset; otherwise renders all.
 */
export function UnderstandingSurface({
  state,
  visibleNodeIds,
  label,
}: {
  state: CognitiveState;
  visibleNodeIds?: string[];
  label?: React.ReactNode;
}) {
  const visible = visibleNodeIds
    ? state.nodes.filter((n) => visibleNodeIds.includes(n.id))
    : state.nodes;
  return (
    <div className="understanding">
      {label}
      {orderNodes(visible).map((n) => (
        <CognitiveNodeView key={n.id} node={n} />
      ))}
    </div>
  );
}

/**
 * Proportionality: the understanding surface scales with epistemic complexity.
 * Don't put a hypothesis board on "reformat this JSON".
 */
export function ProportionalView({ state, showTag = true }: { state: CognitiveState; showTag?: boolean }) {
  const t = useStrings();
  const tag = showTag ? (
    <div className="proportion-tag">
      <b>{state.latentLevel}</b> {t.level[state.latentLevel]}
    </div>
  ) : null;

  if (state.latentLevel === "low") {
    // collapse to a single grounded line + provenance
    const grounded = state.nodes.find((n) => n.state === "grounded");
    return (
      <div className="understanding">
        {tag}
        {grounded ? (
          <GroundedClaimCard node={grounded as Extract<CognitiveNode, { state: "grounded" }>} />
        ) : (
          state.nodes.slice(0, 1).map((n) => <CognitiveNodeView key={n.id} node={n} />)
        )}
      </div>
    );
  }

  if (state.latentLevel === "mid") {
    // grounded + open + at most two hypotheses; no full board
    const picked = orderNodes(state.nodes).filter((n) => {
      return n.state !== "refuted";
    });
    let hypoCount = 0;
    const trimmed = picked.filter((n) => {
      if (n.state === "hypothesis") {
        hypoCount += 1;
        return hypoCount <= 2;
      }
      return true;
    });
    return (
      <div className="understanding">
        {tag}
        {trimmed.map((n) => (
          <CognitiveNodeView key={n.id} node={n} />
        ))}
      </div>
    );
  }

  // high: full board
  return <UnderstandingSurface state={state} label={tag} />;
}
