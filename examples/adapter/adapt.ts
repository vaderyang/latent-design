#!/usr/bin/env bun
/**
 * Adapter example — a real agent trace → a valid CognitiveState.
 *
 *   bun examples/adapter/adapt.ts            # adapt, validate, print a report
 *   bun examples/adapter/adapt.ts --write    # also write adapted.json
 *
 * The honest split every migration has to make:
 *
 *   1. MECHANICAL (deterministic, this file does it): tool_use blocks become
 *      ToolCalls, tool_result blocks become ObservablePrimitives, the user's
 *      message becomes the primitive a `requirement` node anchors to.
 *
 *   2. COGNITIVE (a parsing model does it): which claims are grounded, what
 *      was hypothesized and refuted, where the inflection happened. No
 *      adapter can derive understanding from a trace mechanically — that is
 *      the whole point of the design language. PARSE_PROMPT below is the
 *      prompt for the parsing model; MODEL_PARSE inlines one such parse so
 *      this example runs offline.
 *
 *   3. THE GATE: merge both halves, then validateCognitiveState. Theater —
 *      free-floating claims, unfalsifiable hunches, phantom references —
 *      is rejected here, mechanically.
 */
// in your app these are `@latent/schema` / `@latent/validator`;
// relative here because examples/ sits outside the workspaces
import { stateToEvents, type CognitiveState } from "../../schema/src/index.ts";
import { validateCognitiveState } from "../../validator/src/index.ts";

/* ------------------------------------------------------------------ trace */
/** A Claude-API-shaped tool-use trajectory. In real use: read yours from disk. */
const TRACE = {
  messages: [
    {
      role: "user",
      content: "Checkout latency spiked around 14:00 — what happened?",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "Let me look at the latency metrics first." },
        { type: "tool_use", id: "toolu_01", name: "query_metrics", input: { metric: "checkout.p99", window: "13:50-14:10" } },
      ],
    },
    {
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: "toolu_01", content: "p99 380ms→1.84s between 13:58 and 14:09; all elevated samples from instance-7" },
      ],
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "Concentrated on instance-7. Checking whether the 13:45 deploy touched it." },
        { type: "tool_use", id: "toolu_02", name: "deploy_log", input: { service: "checkout", since: "13:00" } },
      ],
    },
    {
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: "toolu_02", content: "13:45 deploy rolled to instances 1-6 only; instance-7 still on previous build" },
      ],
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "Not the deploy — instance-7 never got it. Pulling its GC telemetry." },
        { type: "tool_use", id: "toolu_03", name: "gc_stats", input: { instance: "instance-7", window: "13:50-14:10" } },
      ],
    },
    {
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: "toolu_03", content: "old-gen at 96%; six full-GC pauses of 1.2-1.7s between 13:58 and 14:09" },
      ],
    },
    {
      role: "assistant",
      content:
        "Root cause: full-GC pauses on instance-7 (old-gen exhaustion), not the 13:45 deploy — that rollout never reached instance-7. Recommend recycling instance-7 and lowering the old-gen alarm threshold.",
    },
  ],
} as const;

/* ----------------------------------------------- 1. mechanical extraction */

type Scaffold = Pick<CognitiveState, "observablePrimitives" | "toolCalls">;

function extractScaffold(trace: typeof TRACE): Scaffold {
  const observablePrimitives: Scaffold["observablePrimitives"] = [];
  const toolCalls: Scaffold["toolCalls"] = [];

  for (const m of trace.messages) {
    if (typeof m.content === "string") {
      if (m.role === "user")
        observablePrimitives.push({ id: "op:user-msg", kind: "user-statement", label: m.content });
      continue;
    }
    for (const block of m.content) {
      if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          ts: "—",
          fn: block.name,
          args: { ...block.input },
          producedPrimitives: [`op:${block.id}`],
        });
      } else if (block.type === "tool_result") {
        observablePrimitives.push({ id: `op:${block.tool_use_id}`, kind: "tool-result", label: block.content });
      }
    }
  }
  return { observablePrimitives, toolCalls };
}

/* ------------------------------------------------- 2. cognitive parsing */

/** Hand this (plus the trace and the JSON Schema) to a parsing model. */
export const PARSE_PROMPT = `You are parsing a raw agent trace into the cognitive half of a CognitiveState
(schema: schema/cognitive-state.schema.json — nodes, outcome, steps, task,
latentLevel). The mechanical half (observablePrimitives, toolCalls) is provided;
reference ONLY those ids. Rules, enforced mechanically downstream:
- every grounded claim needs evidence pinned to real primitives AND provenance
  whose steps resolve to real toolCalls; mark it verifiable ONLY if you can
  state a command that re-establishes it, and put that command in reExecCmd;
- every hypothesis needs a concrete falsification condition;
- everything considered-and-rejected stays as a refuted node (never delete);
- a change of direction is an inflection node (from / to / rationale);
- set latentLevel proportionally to the epistemic work actually done.
Output: JSON for { task, latentLevel, nodes, outcome, steps }.`;

/** One such parse, inlined so the example runs offline. */
const MODEL_PARSE: Omit<CognitiveState, "observablePrimitives" | "toolCalls" | "persona"> = {
  schemaVersion: "0.2",
  latentLevel: "high",
  task: {
    title: "Checkout latency spike at 14:00",
    goal: "find the root cause and what to do about it",
    status: "root cause grounded",
  },
  nodes: [
    {
      id: "n:req",
      title: "Explain the 14:00 checkout latency spike",
      state: "grounded",
      kind: "requirement",
      confidence: { value: 0.98, source: "human" },
      evidence: [{ id: "e:req", label: "the user's own words", primitives: ["op:user-msg"], polarity: "supports" }],
      provenance: {
        mode: "asserted",
        steps: [{ toolCallId: "toolu_01", observed: "spike window confirmed as 13:58–14:09", primitives: ["op:user-msg", "op:toolu_01"] }],
      },
    },
    {
      id: "n:deploy",
      title: "The 13:45 deploy caused the spike",
      state: "refuted",
      kind: "claim",
      reason: "the rollout reached instances 1–6 only; instance-7 — where every elevated sample lives — never got it",
      formerConfidence: 0.6,
    },
    {
      id: "n:turn",
      title: "Not the deploy — follow the instance, not the event",
      state: "inflection",
      inflectKind: "refutation",
      from: "deploy regression",
      to: "instance-7 local pathology",
      rationale: "deploy_log shows instance-7 still on the previous build",
      affects: ["n:deploy", "n:gc"],
    },
    {
      id: "n:gc",
      title: "Full-GC pauses on instance-7 caused the spike",
      state: "grounded",
      kind: "claim",
      confidence: { value: 0.93, source: "self_consistency" },
      evidence: [
        { id: "e:p99", label: "p99 spike isolated to instance-7", primitives: ["op:toolu_01"], polarity: "supports" },
        { id: "e:gc", label: "six 1.2–1.7s full-GC pauses in the exact window", primitives: ["op:toolu_03"], polarity: "supports" },
      ],
      provenance: {
        mode: "verifiable",
        reExecCmd: "gc_stats --instance instance-7 --window 13:50-14:10",
        steps: [
          { toolCallId: "toolu_01", observed: "elevated samples all from instance-7", primitives: ["op:toolu_01"] },
          { toolCallId: "toolu_03", observed: "old-gen 96%; full-GC pauses match the spike window", primitives: ["op:toolu_03"] },
        ],
      },
    },
  ],
  outcome: {
    nodeId: "n:gc",
    text: "Full-GC pauses on instance-7 (old-gen exhaustion) — not the 13:45 deploy, which never reached it.",
    recommendation: "Recycle instance-7; lower the old-gen alarm threshold.",
    label: "Root cause",
  },
  steps: [
    { label: "scope", hint: "isolate the spike", visibleNodeIds: ["n:req"] },
    { label: "test the obvious", hint: "was it the deploy?", visibleNodeIds: ["n:req", "n:deploy"] },
    { label: "turn", hint: "follow the instance", visibleNodeIds: ["n:req", "n:deploy", "n:turn"] },
    { label: "ground", hint: "GC telemetry settles it", visibleNodeIds: ["n:req", "n:deploy", "n:turn", "n:gc"] },
  ],
};

/* --------------------------------------------------------- 3. the gate */

const adapted = { ...MODEL_PARSE, persona: "operator", ...extractScaffold(TRACE) };
const res = validateCognitiveState(adapted);

if (!res.ok) {
  console.error("✗ the adapted state failed the Grounding Contract:");
  for (const i of res.issues) console.error(`  ${i.path || "(root)"}  ${i.message}`);
  process.exit(1);
}

const events = stateToEvents(res.data!);
console.log("✓ trace adapted into a valid CognitiveState");
console.log(`  primitives ${res.data!.observablePrimitives.length} · toolCalls ${res.data!.toolCalls.length} · nodes ${res.data!.nodes.length}`);
console.log(`  as a stream: ${events.length} StreamingEvents (feed to useLatentStream / replay live)`);

if (Bun.argv.includes("--write")) {
  const out = new URL("adapted.json", import.meta.url).pathname;
  await Bun.write(out, JSON.stringify(res.data, null, 2) + "\n");
  console.log(`  wrote ${out}`);
}
