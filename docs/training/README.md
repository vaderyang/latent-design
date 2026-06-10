**English** · [中文](README.zh.md)

# Latent · 潜 — Model (Training) Design Spec

> **The design language = the training target.** If "Latent is attentioned" is to govern all applications, the model must be
> *trained* to emit well-formed, calibrated, falsifiable cognitive state — honest confidence, real falsification conditions, no theater.
> This spec defines what the model should learn to produce; the UI is merely its honest readout.

## 1. The schema is the target

The model's output target is a valid `CognitiveState` (see `schema/cognitive-state.schema.json`, generated from `schema/src/cognitive-state.ts`). It is not an "additional structured summary" but the **primary product**: the understanding is the thing being emitted, and the natural-language narrative is its projection.

Top level: `latentLevel · persona · task · observablePrimitives[] · toolCalls[] · nodes[] · outcome? · steps?`. A node is a five-state discriminated union: `grounded / hypothesis / open / inflection / refuted` (encoding the epistemic stance), plus an orthogonal optional `kind` content role (decision / plan / requirement / option / tradeoff / answer / risk / observation / claim).

**This is a general emit target, not diagnosis-specific**: the model should learn to emit well-formed CognitiveState across planning, authoring, advising, agentic action, building, and more — a `decision` that takes the main stage must equally be grounded/tentative/open, under the same discipline as a diagnostic `claim`. `examples/` already contains one gold instance per archetype.

## 2. Reward shaping

Two layers: a **hard gate (schema-validity gate)** + **shaped rewards**.

### 2.1 The hard gate (gate; violation = 0)
Mechanically enforced by `@latent/validator` — this is exactly why it exists:

- The output must pass `CognitiveState` validation.
- A grounded claim must carry openable provenance, and the `toolCallId` / `primitives` of its provenance.steps must **resolve** to declared toolCalls / observablePrimitives.
- A hypothesis must carry a non-empty `falsification`.
- An open question must carry a non-empty `needs`.
- `verifiable` provenance must carry a `reExecCmd`.

> This layer keeps reasoning theater out at the door: free-floating assertions that don't land on evidence can earn no reward.

### 2.2 Shaped rewards (shaped; preferred among those that pass the gate)
- **Calibrated confidence**: how well `confidence.value` is calibrated to actual accuracy (Brier / ECE). Prefer `source ∈ {logprob, self_consistency}`, and penalize any overconfidence from `self_report`.
- **Meaningful falsification**: executable/observable refutation conditions (not empty words), ideally automatically adjudicable.
- **Resolvable and sufficient provenance**: every piece of evidence pins to a real primitive; a verifiable `reExecCmd` actually recomputes.
- **Genuine inflections**: an `inflection` appears only where internal confidence undergoes a large shift (inflections are the most faithful part of the latent); penalize performative "aha."
- **Honest open questions**: keep an open where the unknown is genuine; penalize "pretending to be certain."
- **Proportionality**: `latentLevel` matches the task's true complexity; penalize forcing a hypothesis board onto trivial tasks.

### 2.3 Penalties (anti-theater)
- Theatrical voice ("let me dive deep into this complex problem…", "carefully examining…").
- Deletion-style refute (it should be sunk and kept, never erased from nodes).
- Sourceless/evidenceless "vibe" confidence numbers.

## 3. SFT data format

Paired samples `(trace, CognitiveState)`:

- `trace` = the raw agent trajectory (tool calls + intermediate reasoning + final answer).
- `CognitiveState` = that trajectory parsed/rewritten into a valid instance (the gold label).

`examples/*.json` are the seed gold instances (TraceForge / finance / research / coding / logs), covering the full low→high spectrum. A suggested data-synthesis pipeline:
1. Run the agent to get a raw trace;
2. Use a stronger model (or a human) to parse the trace into a `CognitiveState`;
3. `bun run validate` passes the gate before it enters the store;
4. Deliberately construct **negative samples** (missing falsification, free-floating provenance, deletion-style refute, vibe confidence) to train the discriminative/penalty signal.

## 4. verifiable vs asserted — the fork that decides everything

Applications split in two by the verifiability of their grounding (from the core technical program in MISSION):

- **verifiable-grounded**: the evidence chain can be **re-executed** and verified (TraceForge's fault-injection / verifiable rewards, coding's test re-runs, log-triage's openssl re-verification). Here the reward can be machine-recomputed — **this is exactly the asset of your fault-injection / verifiable-rewards infrastructure.**
- **asserted-grounded**: self-reported only (some financial correlations, soft tasks). The reward is limited by the faithfulness of self-report, and the UI/label must honestly down-weight it.

> Your application portfolio bifurcates along this line; the UI must mark the two differently, and the model should also learn to **honestly label the type of its own grounding.**

## 5. Faithfulness caveats (internalize these)

- **The rendered latent ≠ the real latent.** Verbalized reasoning is often post-hoc rationalization; a perfectly self-consistent explanation may be wholly confabulated.
- Therefore: on **models you own**, confidence should be derived as much as possible from logprobs / self-consistency, and inflections from activation-space probes — far more faithful than pure-API self-report. This design language **renders more truthfully on your own distilled edge models** — a non-obvious synergy with the edge-deployment thesis.
- The Grounding Contract reduces but does not eliminate reasoning theater; the residual is a backend problem (machine-verifiable grounding), not a UI one.

## 6. Hooking into the Lab

- The schema and validator can be referenced directly by training/evaluation pipelines: `import { CognitiveState } from "@latent/schema"` / `import { validateCognitiveState } from "@latent/validator"`.
- Suggested evaluation metrics: schema-pass-rate, falsification coverage, provenance-resolvability rate, confidence calibration (ECE/Brier), inflection faithfulness (correlation with internal uncertainty shifts), and proportionality-match rate.
