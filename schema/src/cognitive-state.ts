/**
 * CognitiveState — the canonical contract of Latent · 潜.
 *
 * A GENERAL contract for any agent application — diagnosis, planning, authoring,
 * advisory, agentic action/ambient, app-building, extraction. The Grounding
 * Contract is the universal: whatever occupies primary attention must be
 * falsifiable/revisable and anchored to something (evidence, sources, the user's
 * stated goal, constraints, prior decisions) — never a free-floating assertion.
 *
 * Two orthogonal axes describe a cognitive node:
 *   • `state`  — the EPISTEMIC stance (how firmly held, is it evidence-anchored):
 *                grounded / hypothesis / open / inflection / refuted. Drives color.
 *   • `kind`   — the CONTENT ROLE (what kind of thinking it is): claim / decision /
 *                plan / requirement / option / tradeoff / answer / risk / observation.
 *                Drives the role label. Optional; defaults to a claim/answer.
 *
 * One definition, four consumers: (a) the output a model must learn to emit,
 * (b) the props that drive @latent/react, (c) what @latent/validator enforces,
 * (d) the JSON Schema the Claude Code skill references.
 *
 * Hard constraints encode the Grounding Contract so the validator mechanically
 * rejects reasoning theater:
 *   • a grounded node cannot exist without resolvable provenance,
 *   • a hypothesis cannot exist without a falsification condition,
 *   • verifiable provenance cannot exist without a re-executable command,
 *   • every evidence / provenance reference must resolve to a declared primitive.
 */
import { z } from "zod";

/* ----------------------------------------------------------------- enums */

/** Proportionality: how much epistemic apparatus the surface should render. */
export const LatentLevel = z.enum(["low", "mid", "high"]);
export type LatentLevel = z.infer<typeof LatentLevel>;

/** Two personas: operator (latent-led, default) vs trace (tool-call-led). */
export const Persona = z.enum(["operator", "trace"]);
export type Persona = z.infer<typeof Persona>;

/** The five legal epistemic states of a cognitive node. (drives color) */
export const EpistemicState = z.enum([
  "grounded",
  "hypothesis",
  "open",
  "inflection",
  "refuted",
]);
export type EpistemicState = z.infer<typeof EpistemicState>;

/** The content role — what kind of thinking a node is. (orthogonal to state) */
export const NodeKind = z.enum([
  "observation", // something the agent perceived
  "claim", // an assertion about a fact (default for diagnosis/synthesis)
  "decision", // a chosen course of action / commitment
  "plan", // a step the agent intends to take
  "requirement", // an understood intent / constraint / spec
  "option", // a candidate not yet chosen
  "tradeoff", // a weighed gain-vs-cost
  "answer", // a direct response / recommendation (default for advisory/QA)
  "risk", // a hazard or thing that could go wrong
]);
export type NodeKind = z.infer<typeof NodeKind>;

/**
 * Optional grounding ladder — a domain's ontology depth. Diagnosis uses
 * evidence→symptom→hypothesis→conclusion; other domains use other rungs or
 * none. Optional and not load-bearing for rendering.
 */
export const Layer = z.enum([
  "source",
  "observation",
  "evidence",
  "symptom",
  "inference",
  "hypothesis",
  "option",
  "decision",
  "claim",
  "requirement",
  "plan",
  "conclusion",
  "risk",
]);
export type Layer = z.infer<typeof Layer>;

/**
 * Trust-calibration axis. verifiable = the grounding link is re-executable;
 * asserted = self-reported only (e.g. grounded in a user statement). The UI
 * MUST surface this so users calibrate trust.
 */
export const GroundingMode = z.enum(["verifiable", "asserted"]);
export type GroundingMode = z.infer<typeof GroundingMode>;

/** Where a confidence number came from. Guards against ungrounded "vibe numbers". */
export const ConfidenceSource = z.enum(["logprob", "self_consistency", "self_report", "human"]);
export type ConfidenceSource = z.infer<typeof ConfidenceSource>;

/* --------------------------------------------------- observable primitives */

/**
 * Layer-1 ground truth. Everything epistemic threads back to these. For
 * non-diagnosis apps a "primitive" can be a user statement, a constraint, a
 * cited source, a prior decision, or a tool result — not only an observed fact.
 */
export const ObservablePrimitive = z.object({
  id: z.string().describe("stable id, e.g. op:pcap:core-pay-seg or op:req:user-msg"),
  kind: z
    .string()
    .describe("user-statement | constraint | source | prior-decision | tool-result | document | code | metric | log | pcap | …"),
  label: z.string(),
  ref: z.string().optional().describe("URI/path to the raw artifact, if any"),
});
export type ObservablePrimitive = z.infer<typeof ObservablePrimitive>;

/* ------------------------------------------------------------- tool calls */

/** An Activity-Stream item — peripheral, transient, but always auditable. */
export const ToolCall = z.object({
  id: z.string(),
  ts: z.string().describe("timestamp or '—'"),
  fn: z.string().describe("tool name, e.g. pcap_slice / write_file / send_email"),
  args: z.record(z.unknown()).optional(),
  summary: z.string().optional(),
  durationMs: z.number().nonnegative().optional(),
  producedPrimitives: z.array(z.string()).default([]).describe("ObservablePrimitive ids this call yielded"),
});
export type ToolCall = z.infer<typeof ToolCall>;

/* ------------------------------------------------------------- provenance */

const ProvenanceStep = z.object({
  toolCallId: z.string().describe("→ ToolCall.id"),
  observed: z.string().describe("what this step established"),
  primitives: z.array(z.string()).min(1).describe("→ ObservablePrimitive ids (required link to ground truth)"),
});

/** The thread back to observable primitives the Grounding Contract demands. */
export const Provenance = z
  .object({
    mode: GroundingMode,
    reExecCmd: z.string().optional().describe("present iff mode === 'verifiable'"),
    steps: z.array(ProvenanceStep).min(1),
  })
  .refine((p) => p.mode !== "verifiable" || !!p.reExecCmd, {
    message: "verifiable provenance MUST carry a re-executable reExecCmd",
    path: ["reExecCmd"],
  });
export type Provenance = z.infer<typeof Provenance>;

/* --------------------------------------------------------------- evidence */

export const Evidence = z.object({
  id: z.string(),
  label: z.string(),
  primitives: z.array(z.string()).min(1).describe("every evidence pins to ≥1 primitive (fact, source, constraint, …)"),
  polarity: z.enum(["supports", "refutes"]).default("supports").describe("supports/favors vs refutes/against"),
});
export type Evidence = z.infer<typeof Evidence>;

/* ------------------------------------------------------------- confidence */

export const Confidence = z.object({
  value: z.number().min(0).max(1),
  source: ConfidenceSource.describe("provenance of the number itself — not a vibe"),
});
export type Confidence = z.infer<typeof Confidence>;

/* ------------------------------------------------------------ node base */

const NodeBase = z.object({
  id: z.string(),
  title: z.string().describe("the cognitive 'voice' line (serif)"),
  kind: NodeKind.optional().describe("content role; defaults to claim/answer when omitted"),
  layer: Layer.optional().describe("optional grounding-ladder rung"),
});

/* --------------------------------------------------- the five node variants */

export const GroundedClaim = NodeBase.extend({
  state: z.literal("grounded"),
  confidence: Confidence,
  evidence: z.array(Evidence).min(1),
  provenance: Provenance.describe("REQUIRED — the openable trace to observable primitives"),
});
export type GroundedClaim = z.infer<typeof GroundedClaim>;

export const Hypothesis = NodeBase.extend({
  state: z.literal("hypothesis"),
  confidence: Confidence,
  evidence: z.array(Evidence).default([]),
  falsification: z.string().min(1).describe("REQUIRED — what evidence/condition would change it"),
  provenance: Provenance.optional(),
});
export type Hypothesis = z.infer<typeof Hypothesis>;

export const OpenQuestion = NodeBase.extend({
  state: z.literal("open"),
  needs: z.string().min(1).describe("REQUIRED — what's needed to resolve it"),
});
export type OpenQuestion = z.infer<typeof OpenQuestion>;

export const Inflection = NodeBase.extend({
  state: z.literal("inflection"),
  inflectKind: z.enum(["backtrack", "aha", "refutation"]).describe("the kind of turn"),
  from: z.string().describe("the prior belief / choice (struck through)"),
  to: z.string().describe("the new direction"),
  rationale: z.string(),
  affects: z.array(z.string()).default([]).describe("node ids this inflection moved"),
});
export type Inflection = z.infer<typeof Inflection>;

export const Refuted = NodeBase.extend({
  state: z.literal("refuted"),
  reason: z.string().min(1).describe("why it sank — retained, never deleted"),
  formerConfidence: z.number().min(0).max(1).optional(),
});
export type Refuted = z.infer<typeof Refuted>;

export const CognitiveNode = z.discriminatedUnion("state", [
  GroundedClaim,
  Hypothesis,
  OpenQuestion,
  Inflection,
  Refuted,
]);
export type CognitiveNode = z.infer<typeof CognitiveNode>;

/* ------------------------------------------------------ stepped narrative */

const Step = z.object({
  label: z.string(),
  hint: z.string(),
  visibleNodeIds: z.array(z.string()),
});

/* ------------------------------------------------------- top-level object */

export const CognitiveState = z
  .object({
    schemaVersion: z.literal("0.2"),
    latentLevel: LatentLevel,
    persona: Persona.default("operator"),
    /** Neutral task container — works for any agent application. */
    task: z.object({
      title: z.string(),
      goal: z.string().optional().describe("what the agent is trying to accomplish"),
      context: z.string().optional(),
      status: z.string().optional().describe("e.g. severity, progress, or state badge"),
    }),
    /**
     * The user story that situates this interface — who is looking at it, why,
     * what they read here, and what they can do. Answers "who does what here?"
     * and is the antidote to an abstract, high-cognitive-load board.
     */
    userStory: z
      .object({
        who: z.string().describe("the persona, e.g. Payments SRE · on-call at 3am"),
        trigger: z.string().optional().describe("what brought them here"),
        goal: z.string().describe("what they want to accomplish"),
        reads: z.string().describe("what they SEE on this surface"),
        acts: z.string().describe("what they can DO here (the real user action)"),
      })
      .optional(),
    observablePrimitives: z.array(ObservablePrimitive),
    toolCalls: z.array(ToolCall),
    nodes: z.array(CognitiveNode),
    /** The settled result — a conclusion, decision, recommendation, or deliverable. */
    outcome: z
      .object({
        nodeId: z.string(),
        text: z.string(),
        recommendation: z.string().optional(),
        label: z.string().optional().describe("e.g. Conclusion / Decision / Recommendation / Done / Delivered"),
      })
      .optional(),
    steps: z.array(Step).optional().describe("optional stepped demo narrative"),
  })
  .superRefine((s, ctx) => {
    const prims = new Set(s.observablePrimitives.map((p) => p.id));
    const calls = new Set(s.toolCalls.map((c) => c.id));
    const nodeIds = new Set(s.nodes.map((n) => n.id));

    const checkPrim = (pid: string, where: string) => {
      if (!prims.has(pid))
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${where} references unknown primitive "${pid}"` });
    };

    for (const n of s.nodes) {
      if (n.state === "grounded" || n.state === "hypothesis") {
        n.evidence?.forEach((e) => e.primitives.forEach((pid) => checkPrim(pid, `node "${n.id}" evidence "${e.id}"`)));
      }
      if (n.state === "grounded") {
        n.provenance.steps.forEach((st) => {
          if (!calls.has(st.toolCallId))
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `node "${n.id}" provenance references unknown toolCall "${st.toolCallId}"` });
          st.primitives.forEach((pid) => checkPrim(pid, `node "${n.id}" provenance`));
        });
      }
      if (n.state === "inflection") {
        n.affects.forEach((nid) => {
          if (!nodeIds.has(nid))
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `inflection "${n.id}" affects unknown node "${nid}"` });
        });
      }
    }

    if (s.outcome && !nodeIds.has(s.outcome.nodeId))
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `outcome references unknown node "${s.outcome.nodeId}"`, path: ["outcome", "nodeId"] });

    s.steps?.forEach((step, i) =>
      step.visibleNodeIds.forEach((nid) => {
        if (!nodeIds.has(nid))
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `steps[${i}] references unknown node "${nid}"`, path: ["steps", i] });
      }),
    );
  });

export type CognitiveState = z.infer<typeof CognitiveState>;
