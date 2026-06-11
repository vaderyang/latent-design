**English** · [中文](MIGRATION.zh.md)

# Migrating an existing agentic UI to Latent · 潜

You have an agent and a UI that renders its tool calls. Latent inverts that
hierarchy: the agent's evidence-anchored *understanding* takes the stage and
the tool stream recedes. This guide is the practical path from one to the
other. The worked, runnable version is **`examples/adapter/adapt.ts`** —
read it alongside this page.

## 0. The honest split

A migration has exactly two halves, and conflating them is how reasoning
theater sneaks back in:

- **Mechanical** (deterministic code): your trace's tool calls →
  `toolCalls[]`; their results and the user's own words →
  `observablePrimitives[]`. An adapter does this in ~40 lines.
- **Cognitive** (a parsing model): which claims are *grounded*, what was
  *hypothesized* and *refuted*, where the *inflection* happened, what stays
  honestly *open*. No adapter can derive understanding from a trace
  mechanically — that judgment is exactly what the design language renders.

## 1. Extract the scaffold

Walk your trace once (see `extractScaffold` in the example):

| in your trace | becomes | id convention |
|---|---|---|
| a tool invocation | `ToolCall { id, fn, args }` | keep the trace's own id |
| a tool result | `ObservablePrimitive { kind: "tool-result" }` | `op:<toolCallId>` |
| the user's request | `ObservablePrimitive { kind: "user-statement" }` | `op:user-msg` |

Everything epistemic will thread back to these ids — declare them all.

## 2. Parse the cognition

Hand the trace + the scaffold ids + `schema/cognitive-state.schema.json` to a
parsing model (a stronger model, or the agent itself at the end of its run).
`PARSE_PROMPT` in the example is a starting prompt. The rules it states are
not style advice — the validator enforces them mechanically:

- grounded ⇒ evidence pinned to declared primitives **and** resolvable provenance;
- hypothesis ⇒ a concrete falsification condition;
- considered-and-rejected ⇒ a `refuted` node, never deletion;
- `verifiable` provenance ⇒ a real `reExecCmd` (claim it only when re-execution
  is actually possible — `latent-validate --exec` will run it);
- `latentLevel` proportional to the epistemic work actually done.

## 3. Gate it

```bash
bun run validate your-instance.json          # the Grounding Contract
bun validator/src/cli.ts --exec your.json    # + actually re-run verifiable provenance
```

Wire this into your pipeline the way `bun run check` wires it into this
repo's CI: instances that fail never reach the UI.

## 4. Render it — three adoption depths

1. **Piecemeal (kit only).** Keep your layout; adopt the vocabulary.
   `@latent/react/kit` is schema-free: `<EpistemicCard>`, `<StateDot>`,
   `<Provenance>`, `<CertaintyPill>`… For schema data there is one canonical
   binding: `<NodeCard node={n} />` (and `toEvidenceItems` /
   `toProvenanceProps` / `toConfidenceProps` from `fromSchema`).
2. **The understanding surface.** Put `<UnderstandingPanel state={...} />`
   (or `<ProportionalView>`, which scales rendering by `latentLevel`) where
   your tool-call feed used to be, and demote the feed to `<ActivityStream>`.
3. **The whole app (App Attention Grammar).** Lay the app out in the five
   zones (`@latent/react/app` + `<ZoneLayout>`): Stage holds understanding,
   Artifact holds the work product, Activity/Context recede, Intervene is
   always present. See `/apps/vibe-ide`, `/apps/gen-studio`, `/apps/minutes`.

## 5. Stream it — understanding forms, it doesn't appear

For a live agent, don't batch the final state: emit **StreamingEvents** as
understanding forms (`stream.init`, `primitive.add`, `toolcall.add`,
`node.add`, `node.evidence`, `node.ground`, `node.refute`, `phase`,
`outcome.settle` — `@latent/schema`). On the client:

```tsx
const stream = useLatentStream((emit) => subscribeToYourAgent(emit));
// stream.state is the understanding formed so far — render it
```

`validateStream` holds the *settled* stream to the full contract (a forming
state is exempt). For prerecorded playback, `stateToEvents(state)` converts
any canned instance into the same event vocabulary — the demos are the
special case, your live agent is the general one.

## 6. Boundaries to keep honest

- **asserted vs verifiable** is load-bearing: mark `verifiable` only what
  `--exec` could re-establish; everything self-reported stays `asserted` and
  the UI will down-weight it. For API-only models, treat self-reports as
  `asserted` across the board.
- The validator rejects *structural* theater only. A contract-valid instance
  can still confabulate; re-execution (`--exec`) and your own ground truth
  are the recourse. See `docs/training/` for the research agenda on closing
  the rest of that gap.
