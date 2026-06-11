/**
 * StreamingEvent — "latent is a process" made mechanical.
 *
 * A CognitiveState does not appear; it FORMS. This module defines the event
 * vocabulary in which understanding forms — incremental patches a live agent
 * emits while working — plus the pure reducer that folds events back into a
 * CognitiveState, and `stateToEvents`, which turns a canned instance (with
 * its `steps` narrative) into a prerecorded event stream.
 *
 * The demo playback is therefore a SPECIAL CASE of streaming, not a separate
 * mechanism: canned steps → prerecorded events (`at` offsets) → the same
 * reducer → the same surfaces. A real agent emits the same events live,
 * without `at`.
 *
 * Validation: intermediate states are work-in-progress and not held to the
 * full contract; `validateStream` reduces the whole stream and validates the
 * FINAL state — an understanding may form freely, but what it settles into
 * must honor the Grounding Contract.
 */
import { z } from "zod";
import {
  CognitiveNode,
  CognitiveState,
  Confidence,
  Evidence,
  LatentLevel,
  ObservablePrimitive,
  Persona,
  Provenance,
  ToolCall,
} from "./cognitive-state.ts";

/* ----------------------------------------------------------------- events */

const at = z.number().nonnegative().optional()
  .describe("ms offset from stream start — present on prerecorded streams, absent on live ones");

/** Opens the stream: the task context an understanding will form within. */
export const StreamInit = z.object({
  type: z.literal("stream.init"),
  at,
  schemaVersion: z.literal("0.2"),
  latentLevel: LatentLevel,
  persona: Persona.default("operator"),
  task: z.object({
    title: z.string(),
    goal: z.string().optional(),
    context: z.string().optional(),
    status: z.string().optional(),
  }),
  userStory: z
    .object({
      who: z.string(),
      trigger: z.string().optional(),
      goal: z.string(),
      reads: z.string(),
      acts: z.string(),
    })
    .optional(),
});

/** A new piece of layer-1 ground truth becomes available. */
export const PrimitiveAdd = z.object({ type: z.literal("primitive.add"), at, primitive: ObservablePrimitive });

/** A tool call lands in the (peripheral) activity stream. */
export const ToolCallAdd = z.object({ type: z.literal("toolcall.add"), at, call: ToolCall });

/** A cognitive node surfaces (motion: surface; pulse when it is an inflection). */
export const NodeAdd = z.object({ type: z.literal("node.add"), at, node: CognitiveNode });

/** Confidence moves on a grounded/hypothesis node. */
export const NodeConfidence = z.object({
  type: z.literal("node.confidence"),
  at,
  nodeId: z.string(),
  confidence: Confidence,
});

/** New evidence pins onto a grounded/hypothesis node. */
export const NodeEvidence = z.object({ type: z.literal("node.evidence"), at, nodeId: z.string(), evidence: Evidence });

/** A hypothesis is promoted to grounded (motion: settle — cyan turns gold). */
export const NodeGround = z.object({
  type: z.literal("node.ground"),
  at,
  nodeId: z.string(),
  confidence: Confidence,
  evidence: z.array(Evidence).optional().describe("replaces the node's evidence when present; otherwise existing evidence is kept"),
  provenance: Provenance,
});

/** A node sinks (motion: sink — kept auditable, never deleted). */
export const NodeRefute = z.object({ type: z.literal("node.refute"), at, nodeId: z.string(), reason: z.string().min(1) });

/** A narrative phase boundary — the streaming counterpart of a canned `step`. */
export const PhaseMark = z.object({
  type: z.literal("phase"),
  at,
  label: z.string(),
  hint: z.string(),
  visibleNodeIds: z.array(z.string()).optional().describe("explicit reveal set; defaults to every node streamed so far"),
});

/** The understanding settles into its outcome. */
export const OutcomeSettle = z.object({
  type: z.literal("outcome.settle"),
  at,
  outcome: z.object({
    nodeId: z.string(),
    text: z.string(),
    recommendation: z.string().optional(),
    label: z.string().optional(),
  }),
});

export const StreamingEvent = z.discriminatedUnion("type", [
  StreamInit,
  PrimitiveAdd,
  ToolCallAdd,
  NodeAdd,
  NodeConfidence,
  NodeEvidence,
  NodeGround,
  NodeRefute,
  PhaseMark,
  OutcomeSettle,
]);
export type StreamingEvent = z.infer<typeof StreamingEvent>;

/* ---------------------------------------------------------------- reducer */

function findMutableNode(s: CognitiveState, nodeId: string, eventType: string): CognitiveNode {
  const n = s.nodes.find((n) => n.id === nodeId);
  if (!n) throw new Error(`${eventType}: unknown node "${nodeId}"`);
  return n;
}

/** Pure: fold one event into the forming state. Throws on incoherent events. */
export function applyEvent(s: CognitiveState | null, e: StreamingEvent): CognitiveState {
  if (e.type === "stream.init") {
    return {
      schemaVersion: e.schemaVersion,
      latentLevel: e.latentLevel,
      persona: e.persona,
      task: e.task,
      ...(e.userStory ? { userStory: e.userStory } : {}),
      observablePrimitives: [],
      toolCalls: [],
      nodes: [],
    };
  }
  if (!s) throw new Error(`event "${e.type}" before stream.init`);

  switch (e.type) {
    case "primitive.add":
      return { ...s, observablePrimitives: [...s.observablePrimitives, e.primitive] };
    case "toolcall.add":
      return { ...s, toolCalls: [...s.toolCalls, e.call] };
    case "node.add":
      return { ...s, nodes: [...s.nodes, e.node] };
    case "node.confidence": {
      const n = findMutableNode(s, e.nodeId, e.type);
      if (n.state !== "grounded" && n.state !== "hypothesis")
        throw new Error(`node.confidence: node "${e.nodeId}" is ${n.state}, not grounded/hypothesis`);
      return { ...s, nodes: s.nodes.map((x) => (x.id === e.nodeId ? { ...n, confidence: e.confidence } : x)) };
    }
    case "node.evidence": {
      const n = findMutableNode(s, e.nodeId, e.type);
      if (n.state !== "grounded" && n.state !== "hypothesis")
        throw new Error(`node.evidence: node "${e.nodeId}" is ${n.state}, not grounded/hypothesis`);
      return {
        ...s,
        nodes: s.nodes.map((x) => (x.id === e.nodeId ? { ...n, evidence: [...(n.evidence ?? []), e.evidence] } : x)),
      };
    }
    case "node.ground": {
      const n = findMutableNode(s, e.nodeId, e.type);
      if (n.state !== "hypothesis" && n.state !== "open")
        throw new Error(`node.ground: node "${e.nodeId}" is ${n.state}; only a hypothesis/open can settle into grounded`);
      const evidence = e.evidence ?? (n.state === "hypothesis" ? n.evidence : []);
      if (evidence.length === 0) throw new Error(`node.ground: node "${e.nodeId}" would be grounded with no evidence`);
      const grounded: CognitiveNode = {
        id: n.id,
        title: n.title,
        ...(n.kind ? { kind: n.kind } : {}),
        ...(n.layer ? { layer: n.layer } : {}),
        state: "grounded",
        confidence: e.confidence,
        evidence,
        provenance: e.provenance,
      };
      return { ...s, nodes: s.nodes.map((x) => (x.id === e.nodeId ? grounded : x)) };
    }
    case "node.refute": {
      const n = findMutableNode(s, e.nodeId, e.type);
      const former = n.state === "grounded" || n.state === "hypothesis" ? n.confidence?.value : undefined;
      const refuted: CognitiveNode = {
        id: n.id,
        title: n.title,
        ...(n.kind ? { kind: n.kind } : {}),
        ...(n.layer ? { layer: n.layer } : {}),
        state: "refuted",
        reason: e.reason,
        ...(former !== undefined ? { formerConfidence: former } : {}),
      };
      return { ...s, nodes: s.nodes.map((x) => (x.id === e.nodeId ? refuted : x)) };
    }
    case "phase": {
      const step = {
        label: e.label,
        hint: e.hint,
        visibleNodeIds: e.visibleNodeIds ?? s.nodes.map((n) => n.id),
      };
      return { ...s, steps: [...(s.steps ?? []), step] };
    }
    case "outcome.settle":
      return { ...s, outcome: e.outcome };
  }
}

/** Pure: fold a whole stream. */
export function reduceStream(events: StreamingEvent[]): CognitiveState | null {
  let s: CognitiveState | null = null;
  for (const e of events) s = applyEvent(s, e);
  return s;
}

/**
 * Reduce the stream and hold the FINAL state to the Grounding Contract.
 * (Intermediate states are forming and exempt; what settles must comply.)
 */
export function validateStream(events: StreamingEvent[]):
  | { ok: true; state: CognitiveState }
  | { ok: false; issues: { path: string; message: string }[] } {
  let reduced: CognitiveState | null;
  try {
    reduced = reduceStream(events);
  } catch (e) {
    return { ok: false, issues: [{ path: "(stream)", message: String(e instanceof Error ? e.message : e) }] };
  }
  if (!reduced) return { ok: false, issues: [{ path: "(stream)", message: "empty stream — no stream.init" }] };
  const r = CognitiveState.safeParse(reduced);
  if (r.success) return { ok: true, state: r.data };
  return { ok: false, issues: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) };
}

/* ----------------------------------------------- canned → prerecorded */

export interface StateToEventsOpts {
  /** ms per narrative phase (mirror @latent/tokens `playback.stepMs`) */
  stepMs?: number;
  /** settle beat after the last phase (mirror @latent/tokens `playback.tailMs`) */
  tailMs?: number;
}

/**
 * Turn a parsed CognitiveState into a prerecorded event stream. This is the
 * bridge that makes the demo a special case: every canned example plays
 * through the exact same event vocabulary a live agent would emit.
 *
 * Nodes stream in narrative order (first step that reveals them, then
 * original order); nodes outside every step surface at t=0. Tool calls are
 * spread proportionally across the run, mirroring the peripheral activity
 * stream's pacing.
 */
export function stateToEvents(state: CognitiveState, opts: StateToEventsOpts = {}): StreamingEvent[] {
  const { stepMs = 3400, tailMs = 1100 } = opts;
  const steps = state.steps ?? [];
  const totalMs = steps.length * stepMs + tailMs;
  const events: StreamingEvent[] = [];

  events.push({
    type: "stream.init",
    at: 0,
    schemaVersion: state.schemaVersion,
    latentLevel: state.latentLevel,
    persona: state.persona,
    task: state.task,
    ...(state.userStory ? { userStory: state.userStory } : {}),
  });

  // ground truth is declared up front — primitives are what everything threads back to
  for (const p of state.observablePrimitives) events.push({ type: "primitive.add", at: 0, primitive: p });

  // first step that reveals each node = its narrative arrival
  const firstStep = new Map<string, number>();
  steps.forEach((st, i) => st.visibleNodeIds.forEach((id) => { if (!firstStep.has(id)) firstStep.set(id, i); }));

  const arrivals = state.nodes
    .map((node, idx) => ({ node, idx, step: firstStep.get(node.id) ?? -1 }))
    .sort((a, b) => a.step - b.step || a.idx - b.idx);
  for (const { node, step } of arrivals)
    events.push({ type: "node.add", at: step < 0 ? 0 : step * stepMs, node });

  steps.forEach((st, i) =>
    events.push({ type: "phase", at: i * stepMs, label: st.label, hint: st.hint, visibleNodeIds: st.visibleNodeIds }),
  );

  const calls = state.toolCalls;
  calls.forEach((call, i) =>
    events.push({ type: "toolcall.add", at: Math.round(((i + 1) / calls.length) * (totalMs - tailMs)), call }),
  );

  if (state.outcome) events.push({ type: "outcome.settle", at: totalMs, outcome: state.outcome });

  return events.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
}
