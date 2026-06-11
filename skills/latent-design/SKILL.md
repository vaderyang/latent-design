---
name: latent-design
description: >-
  Build agentic UIs in the Latent · 潜 design language — a GENERAL language for
  any agent application, not just diagnosis. Use when creating ANY interface that
  renders an agent's evolving understanding: diagnosis/root-cause, planning &
  decisions, authoring/generation, advisory/Q&A, agentic action & ambient
  background agents, app-building (RAD), research, triage, extraction. Enforces
  the Grounding Contract: only falsifiable, evidence-anchored cognition occupies
  primary attention; tool calls recede to an auditable provenance rail. Triggers
  on "agent UI", "reasoning UI", "render the agent's thinking", "decision/plan
  UI", "assistant that explains its reasoning", or any use of @latent/react /
  @latent/schema.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Latent · 潜 — agentic UI skill

> Core law: **Attention follows understanding, not activity.** Invert the
> hierarchy — cognition is the lit primary plane; tool calls recede to a
> peripheral, auditable rail.

This repo *is* the design system. Before building, read these source-of-truth
artifacts (do not reinvent what they already define):

- `schema/cognitive-state.schema.json` — the machine-readable contract (generated
  from `schema/src/cognitive-state.ts`). Every cognitive element you render MUST
  validate against `CognitiveState`.
- `packages/tokens/tokens.json` + `packages/tokens/tokens.css` — color (epistemic
  state), type (three voices), motion (surface/settle/sink/pulse). Never hardcode
  a color or font; use the tokens.
- `packages/react/src/` — the components. Render through them, don't re-style.
- `examples/traceforge.json` — the canonical gold instance to imitate.
- `docs/product/` (visual spec) and `docs/training/` (the emit-target spec).

## Two orthogonal axes (this is what makes it general)

- `state` — EPISTEMIC stance (drives color): grounded / hypothesis / open /
  inflection / refuted.
- `kind` — CONTENT ROLE (drives the badge label): observation / claim / decision
  / plan / requirement / option / tradeoff / answer / risk.

A diagnosis emits mostly `claim`s; a planner emits `decision`/`plan`/`tradeoff`/
`risk`; an author emits `requirement`/`option`; an advisor emits `answer`/`risk`;
an ambient action agent emits `decision`(actions taken)/`plan`(paused for
approval). The contract is identical in every case: a `decision` on the main
stage must still be grounded (anchored to criteria/evidence), or marked tentative
(with a falsification), or left as an honest open. See `examples/` for one
instance per archetype.

## Workflow (data before UI)

1. **Model the agent's output as a `CognitiveState` instance FIRST.** Decide the
   `latentLevel` (low/mid/high) honestly — it governs how much surface renders,
   and tag each node's `kind` (content role).
2. **Validate before rendering:** `bun run validate <file.json>` (or
   `bun validator/src/cli.ts <file>`). It must pass. The validator mechanically
   rejects reasoning theater — a green check is the contract holding. Add
   `--exec` to actually re-run every `verifiable` provenance command; mark
   provenance `verifiable` only when that re-execution is genuinely possible.
3. **Render only via `@latent/react`.** Import the styles once:
   ```ts
   import "@latent/tokens/css";
   import "@latent/react/styles";
   ```
   Then `<Scenario state={state} stepped />` for a worked example, or
   `<ProportionalView state={state} />` to auto-scale by latentLevel, or compose
   the individual cards (`<GroundedClaimCard>`, `<HypothesisCard>`,
   `<OpenQuestionCard>`, `<InflectionMarker>`, `<RefutedCard>`,
   `<ActivityStream>`, `<InterventionRail>`, `<PersonaToggle>`).

## Component ⇄ schema map

| schema node `state` | component | required fields |
|---|---|---|
| `grounded` | `<GroundedClaimCard>` | confidence + evidence(≥1) + **provenance** |
| `hypothesis` | `<HypothesisCard>` | confidence + **falsification** |
| `open` | `<OpenQuestionCard>` | **needs** |
| `inflection` | `<InflectionMarker>` | inflectKind + from + to + rationale |
| `refuted` | `<RefutedCard>` | reason (sunk, never deleted) |

Each card's badge shows the node's `kind` label (decision / plan / requirement /
option / answer / risk …) when present; color always encodes `state`.

Kit skin: `<NodeCard node={n} />` (`@latent/react/kit`) renders any schema node
through the kit's `EpistemicCard`/`InflectionMark` — same contract, kit look.

## Streaming — understanding forms, it doesn't appear

A live agent should emit **StreamingEvents** (`@latent/schema`: `stream.init` /
`primitive.add` / `toolcall.add` / `node.add` / `node.evidence` / `node.ground` /
`node.refute` / `phase` / `outcome.settle`) as it works, and the client renders
with `useLatentStream(subscribe)` — `stream.state` is the understanding formed
so far. Canned demos are the special case: `stateToEvents(state)` turns any
instance into a prerecorded stream; `useLatentClock` plays `steps` directly.
`validateStream` holds the settled stream to the full Grounding Contract.

## Audience & default: plain language

The target user is a **domain expert who is an AI novice**. The DEFAULT view must
read like a smart colleague's note, not a dashboard — use `<PlainView>` (or
`<UnderstandingPanel variant="plain">`, the default). Reserve the dense epistemic
board for a "Detailed" toggle and the raw trace for "Developer".

- Lead with **your question → my judgement**, in plain words.
- Certainty in **words, never raw numbers**: "fairly sure" / "mostly sure" /
  "inclined to think" / "still judging" / "to be confirmed".
- **Translate insider terms**: grounded → "fairly sure", provenance → "how I
  confirmed it", verifiable → "this one can be re-checked", hypothesis → "I lean /
  still judging", refuted → "I considered it but ruled it out".
- Carry weight with **whitespace and type**, not borders / badges / mono readings.
- Never leak jargon into user-facing text (no "(grounded 0.82)", no "(see open)").

## DO

- Parse raw CoT into the five legal states — never dump it raw.
- Every hypothesis carries a `confidence` **and** a `falsification` ("what would
  change it"). Every grounded claim carries openable `provenance` whose steps
  pin back to declared `observablePrimitives`.
- Surface inflections (backtrack / aha / refutation); sink procedural narration
  ("I'm reading a file") to the peripheral Activity Stream.
- Mark provenance `verifiable` (re-executable — include `reExecCmd`) vs
  `asserted` (self-reported) so users calibrate trust correctly.
- Record `confidence.source` (logprob / self_consistency / self_report / human).
- Sink refuted claims with a reason; keep them auditable.
- Scale with `latentLevel`: a low-latent task is one grounded line + provenance.
- **Situate the surface with a `userStory`** (who / trigger / goal / what they
  read here / what they can do). An unframed board reads as high-load and
  abstract; the story answers "who does what here?".
- **Lead with the answer.** A user ARRIVES at the current understanding — show
  the `outcome` first, then the understanding behind it.
- **The user reads + intervenes; the agent advances itself.** Don't make
  "step the agent's thinking" the primary action. The real action is the
  intervention rail. Any step-through is an optional, clearly-labelled REPLAY of
  how the understanding formed (demo/inspection only), never a primary CTA.

## DON'T (adoption red lines — these quietly rebuild theater)

- ✗ Dump raw chain-of-thought onto the main stage.
- ✗ Fake "busy" with spinners/progress bars — activity ≠ understanding.
- ✗ Show ungrounded "vibe" confidence numbers with no source/evidence.
- ✗ Delete refuted hypotheses to look "clean" — sink, don't delete.
- ✗ Force a hypothesis board onto a low-latent task.
- ✗ Render provenance as a dead, non-openable link — weakened ≠ hidden.

## Voice

Epistemic honesty, not theater. Say "two hypotheses; the application-layer one
has higher confidence" — not "let me carefully analyze this complex problem…".
State confidence, name the unknowns, be honest about the gap between narration
and computation.

## Macro layer — App Attention Grammar

For a whole product UI (not just a board), use `@latent/react/app`. Every app
composes five attention zones; their visual weight is the rule:

- **① Stage (Understanding)** — the lit primary plane. Put `<UnderstandingPanel
  state={…} actions={…} />` here.
- **② Artifact** — the work product (code / canvas / video / doc / data). Neutral.
- **· Activity** — tool calls / jobs / terminal. Peripheral, auditable.
- **· Context** — files / nav / history. Recessive.
- **③ Intervention** — human controls. First-class, always reachable.

Weight: Stage > Artifact > { Context, Activity }; Intervention always reachable.
The macro inversion: don't put the tool-call stream where the Stage belongs.

```css
@import "@latent/tokens/css"; @import "@latent/react/styles"; @import "@latent/react/app";
```
```html
<div class="app-frame" style="grid-template-areas: 'top top top' 'ctx art stage' 'ctx act stage'">
  <div class="app-topbar">…</div>
  <div class="zone zone-context">…files…</div>
  <div class="zone zone-artifact">…editor / canvas…</div>
  <div class="zone zone-activity">…terminal / queue…</div>
  <div class="zone zone-stage"><!-- <UnderstandingPanel/> --></div>
</div>
```
Reference apps: `site/src/pages/apps/vibe-ide.astro`, `gen-studio.astro`.

## Theming

Three themes ship via `<html data-theme="dark|light|kami">` (dark deep-blue /
light cool-paper / kami warm-parchment + ink-blue). Components reference only the
semantic tokens — never hardcode a hex; theming is pure value substitution.

## Reference

- `examples/` — one validated `CognitiveState` per archetype: `traceforge`
  (diagnosis), `planning` (decision), `writing` (authoring), `advisory` (Q&A),
  `action` (ambient agentic action), `rad-app` (RAD app-build), plus
  `proportionality/{low,mid,high}`.
- `schema/cognitive-state.schema.json` — the machine-readable contract (note:
  cross-field Grounding-Contract rules live in Zod refinements and are NOT in
  the JSON Schema — `@latent/validator` is the authority).
- `examples/adapter/adapt.ts` — runnable trace → CognitiveState adapter
  (mechanical scaffold vs model-parsed cognition, then the gate).
- `docs/MIGRATION.md` — retrofitting an existing agentic UI, in three depths.
- `packages/tokens/tokens.json` + `tokens.css` — tokens (3 themes).
- `docs/product/` — full visual spec. `docs/training/` — the training research
  agenda (the hard gate is real; rewards/eval are named open problems).
