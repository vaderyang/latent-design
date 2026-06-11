**English** · [中文](README.zh.md)

# Latent · 潜 — Model Training: a Research Agenda

> **The design language = the training target** is the thesis. This document is the
> *research agenda* toward it — not a buildable training program. One layer of it is
> mechanically real today (the hard gate); everything else is a proposal whose open
> problems are named honestly below. If "Latent is attentioned" is to govern all
> applications, the model must eventually be *trained* to emit well-formed, calibrated,
> falsifiable cognitive state; the UI is merely its honest readout.

## 0. Status: what is real vs what is proposed

| Layer | Status | Where |
|---|---|---|
| Schema as emit target (`CognitiveState`) | **shipped** | `schema/src/cognitive-state.ts` |
| Hard gate: structural contract, mechanically enforced | **shipped** | `@latent/validator` (`bun run validate`) |
| Negative samples for the gate (one per hard constraint) | **shipped** (seed set) | `validator/fixtures/negative/` |
| Re-execution of verifiable provenance | **shipped** (opt-in) | `latent-validate --exec` |
| Shaped rewards (calibration, falsification quality, …) | **proposed** — no implementation | §3 |
| Eval metrics (ECE/Brier, inflection faithfulness, …) | **proposed** — no code computes them | §7 |
| SFT data pipeline (trace → gold CognitiveState at scale) | **proposed** — sketch only; `examples/` holds ~22 seed instances, not a corpus | §4 |
| Learnable `latentLevel` / `Provenance.mode` | **open problem** — today both are set by the pipeline/human; there is no learning signal | §6 |

The honest summary: **the gate is a program; the rewards are an agenda.**

## 1. The schema is the target

The model's output target is a valid `CognitiveState` (see `schema/cognitive-state.schema.json`, generated from `schema/src/cognitive-state.ts`). It is not an "additional structured summary" but the **primary product**: the understanding is the thing being emitted, and the natural-language narrative is its projection.

Top level: `latentLevel · persona · task · observablePrimitives[] · toolCalls[] · nodes[] · outcome? · steps?`. A node is a five-state discriminated union: `grounded / hypothesis / open / inflection / refuted` (encoding the epistemic stance), plus an orthogonal optional `kind` content role (decision / plan / requirement / option / tradeoff / answer / risk / observation / claim).

**This is a general emit target, not diagnosis-specific**: the model should learn to emit well-formed CognitiveState across planning, authoring, advising, agentic action, building, and more — a `decision` that takes the main stage must equally be grounded/tentative/open, under the same discipline as a diagnostic `claim`. `examples/` contains one gold instance per archetype.

## 2. The hard gate — the one layer that is mechanically real

Enforced by `@latent/validator` today, violation = reject:

- The output must pass `CognitiveState` validation.
- A grounded claim must carry openable provenance, and the `toolCallId` / `primitives` of its provenance.steps must **resolve** to declared toolCalls / observablePrimitives.
- A hypothesis must carry a non-empty `falsification`; an open question a non-empty `needs`.
- `verifiable` provenance must carry a `reExecCmd` — and `latent-validate --exec` will **actually re-execute it**, which is the only check that makes "verifiable" mean something.
- All referable ids must be unique; the outcome cannot point at a refuted node.

`validator/fixtures/negative/` holds one rejected instance per constraint — the seed of the negative-sample corpus §4 calls for.

> This layer keeps the *structural* forms of reasoning theater out at the door: free-floating assertions that don't land on evidence can earn no reward. **What it cannot do is verify semantics**: it accepts any prose as a `falsification`, any self-reported `confidence.source`, and (without `--exec`) any string as a `reExecCmd`. A model can emit contract-valid theater. Closing that gap is precisely the research program below.

## 3. Reward shaping — *proposed*

Preferred among instances that pass the gate. None of these signals has an implementation today; each carries a named open problem.

- **Calibrated confidence**: how well `confidence.value` is calibrated to actual accuracy (Brier / ECE). Prefer `source ∈ {logprob, self_consistency}`, penalize `self_report` overconfidence. *Open problem: calibration needs post-hoc ground truth per claim — feasible for verifiable-grounded (re-run the check), circular for asserted-grounded (a human must adjudicate the very thing being scored).*
- **Meaningful falsification**: executable/observable refutation conditions, ideally auto-adjudicable. *Open problem: no defined procedure distinguishes a genuinely executable condition from plausible prose; an LLM-judge baseline is unvalidated.*
- **Resolvable and sufficient provenance**: every evidence pins to a real primitive (gate), and a verifiable `reExecCmd` actually recomputes (`--exec` exists; wiring it into a reward loop does not).
- **Genuine inflections**: an `inflection` appears only where internal confidence undergoes a large shift; penalize performative "aha." *Open problem: requires white-box access (activation probes, logprob trajectories) — undefined for API-only models; no detection procedure exists even for owned models.*
- **Honest open questions**: keep an open where the unknown is genuine; penalize "pretending to be certain." *Open problem: ground truth for "genuinely unknown" is undefined.*
- **Proportionality**: `latentLevel` matches the task's true complexity. *Open problem: today `latentLevel` is authored, not predicted — see §6.*

Anti-theater penalties (theatrical voice, deletion-style refute, vibe confidence numbers) are likewise specified-but-unimplemented; deletion-style refute is detectable only with the full trajectory, not from a single instance.

## 4. SFT data — *proposed pipeline, seed data only*

Paired samples `(trace, CognitiveState)`: the raw agent trajectory and its parse into a valid instance (the gold label). The suggested synthesis loop —

1. run the agent to get a raw trace;
2. have a stronger model (or a human) parse the trace into a `CognitiveState`;
3. `bun run validate` gates entry into the store;
4. deliberately construct **negative samples** (missing falsification, free-floating provenance, deletion-style refute, vibe confidence) for the discriminative/penalty signal — `validator/fixtures/negative/` is the seed taxonomy.

— is a sketch, not tooling. What exists: ~22 hand-authored gold instances in `examples/` and the negative fixtures. What a real program needs: thousands of pairs, an automated trace-parser (`examples/adapter/` is the first mechanical step), inter-annotator agreement on gold parses, and a held-out eval split. None of that exists yet.

## 5. verifiable vs asserted — the fork that decides everything

Applications split in two by the verifiability of their grounding (from the core technical program in MISSION):

- **verifiable-grounded**: the evidence chain can be **re-executed** and verified (TraceForge's fault-injection / verifiable rewards, coding's test re-runs, log-triage's openssl re-verification). Here the reward can be machine-recomputed — this is exactly the asset of the fault-injection / verifiable-rewards infrastructure, and `--exec` is its smallest demonstration.
- **asserted-grounded**: self-reported only (some financial correlations, soft tasks). The reward is limited by the faithfulness of self-report, and the UI/label must honestly down-weight it.

> The application portfolio bifurcates along this line; the UI must mark the two differently, and the model should also learn to **honestly label the type of its own grounding** — which is itself an open problem: today `Provenance.mode` is assigned by the pipeline, and no training signal teaches a model to self-classify it (a wrongly-self-asserted "verifiable" should be machine-checkable by `--exec`, which suggests the reward design, but it has not been built).

## 6. Open problem: proportionality and mode are authored, not learned

Two fields the philosophy treats as *model judgments* are, in every current instance, *pipeline inputs*: `latentLevel` (should a trivial task get a hypothesis board?) and `Provenance.mode`. Until a reward exists that scores the model's own choice of these fields against task ground truth, "the model learns proportionality" is an aspiration. A minimal first experiment: hold the task fixed, vary `latentLevel`, and have humans (or a judge model with a validated rubric) rank the surfaces — that yields the first preference data for proportionality.

## 7. Faithfulness caveats (internalize these)

- **The rendered latent ≠ the real latent.** Verbalized reasoning is often post-hoc rationalization; a perfectly self-consistent explanation may be wholly confabulated.
- Therefore: on **models you own**, confidence should be derived as much as possible from logprobs / self-consistency, and inflections from activation-space probes — far more faithful than pure-API self-report. This design language **renders more truthfully on owned distilled edge models** — a non-obvious synergy with the edge-deployment thesis. For API-only models, inflection-faithfulness rewards are out of reach; the honest fallback is to treat all API self-reports as `asserted`.
- The Grounding Contract reduces but does not eliminate reasoning theater; the residual is a backend problem (machine-verifiable grounding), not a UI one.

## 8. Hooking into the Lab

- The schema and validator can be referenced directly by training/evaluation pipelines today: `import { CognitiveState } from "@latent/schema"` / `import { validateCognitiveState, reExecProvenance } from "@latent/validator"`.
- Proposed evaluation metrics — **none implemented yet**: schema-pass-rate and provenance-resolvability rate (computable now from the validator; trivial first build), confidence calibration (ECE/Brier; needs ground-truth infrastructure), falsification coverage and quality (needs an adjudication procedure), inflection faithfulness (needs white-box access), proportionality-match rate (needs §6's preference data).
- The pragmatic build order: pass-rate metrics → `--exec`-backed reward for verifiable-grounded → calibration on verifiable claims only → everything else.
