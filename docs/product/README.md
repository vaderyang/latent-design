**English** · [中文](README.zh.md)

# Latent · 潜 — Product Design Spec

> For designers and PMs. This spec is the handbook for turning "Latent is attentioned" into concrete interface decisions.
> The source of truth for tokens and components lives in the code (`packages/tokens`, `packages/react`) and the self-demonstrating site (`site/`); this document explains **why** it is designed this way, and the red lines for adopting it.

## 1. The thesis and the inversion

Almost every agentic interface today is **tool-call-rooted**: the UI's generative source is tool output, and reasoning is compressed into a line of fine print beside the action — an after-the-fact justification (action first, explanation second). 潛 turns the hierarchy **upside down**:

- **Understanding (latent) = the main stage.** The agent's continuously evolving, evidence-anchored understanding of the problem holds primary attention.
- **Actions (tool calls) = the periphery.** They recede into a single retrievable, auditable line of provenance.

The allocation of visual weight is a **hard constraint**, not a layout preference.

## 2. The three-zone attention model

| Zone | Role | Lifespan | Visual weight |
|---|---|---|---|
| ① Understanding Surface | the continuously rewritten "problem state" | persistent (revisitable) | primary |
| ② Activity Stream | the tool-call stream | transient | peripheral, collapsed by default, always expandable |
| ③ Intervention Rail | human intervention (challenge / constrain / adopt) | always present | first-class feature, not an edge case |

"New evidence arrives → the understanding changes" — that **change** (a hypothesis promoted or refuted) is the meaningful event, and it is exactly what a user "comes back to check" in the era of ambient/background agents.

## 2.5 User story and interaction model (lowering cognitive load)

An abstract cognition board leaves people unsure "who does what here." So every interface is framed by a **userStory**: **who · trigger · goal · what you see here · what you can do here**.

**The target user is someone who is a domain expert but an AI novice** (a doctor, an analyst, a designer…). So the default presentation must be **plain language**, not cognitive machinery:

- **Three reading levels** (switched from the top-right, "plain" by default):
  - **Plain** `<PlainView>` — reads like a colleague talking: **your question → my judgement (word-level certainty) → why I see it this way (evidence collapsible) → I changed my mind partway → still uncertain / needs you to decide → I ruled this out → what you can do.** No confidence numbers, no insider terms like grounded/provenance, no mono-instrument feel; weight is carried by whitespace and hierarchy, not by borders or badges.
  - **Detailed** — the cognition board (color = state, confidence, evidence, provenance), for the power user who wants to see the machinery.
  - **Developer** — the raw tool-call trace, for builders and auditors.
- **Confidence in words, not numbers**: fairly sure / mostly sure / inclined to think / still judging / to be confirmed. Translate every insider concept into plain language (grounded → "fairly sure", provenance → "how I confirmed it", verifiable → "this one can be re-checked", refuted → "I considered it but ruled it out").

The interaction model must be set straight — otherwise the interface becomes counterintuitive:

- **The user arrives → reads the understanding → intervenes.** When a user opens the interface, what they see is the agent's *current understanding* — so **lead with the conclusion** (outcome on top), then expand the understanding that supports it.
- **The agent advances itself; the user does not "drive" the thinking.** The real user actions are in the intervention rail on the right (adopt / object / add a constraint).
- **"Replaying how it formed" is an optional demonstration/review device, not the primary action.** Making "step forward" the primary button early on was wrong — it implies the user has to prod the agent's thinking step by step. The replay is demoted and clearly labeled "for demonstration."

## 3. The Grounding Contract (the spine)

The rendered latent **≠** the real latent; chain-of-thought is often post-hoc rationalization, and the more beautifully you do it the more dangerous it becomes. So **only falsifiable, evidence-anchored cognition is worthy of occupying primary attention.** Any element that enters the main stage must be one of these legal forms:

| Form | Color | Must carry |
|---|---|---|
| **Grounded Claim** an anchored conclusion | amber `#E7B45C` | **openable provenance** pointing to evidence / observable primitives |
| **Hypothesis** a wager in play | aqua `#54C7C0` | **confidence + "what evidence would change it"** |
| **Open Question** an honest unknown | indigo `#8F79C2` | **what it needs / what resolving it requires** |
| **Inflection** a cognitive turning point | blue `#82A7F2` | from → to + rationale (research confirms inflections are the most faithful part of the latent) |
| **Refuted** sunk | slate `#5C6B7A` | reason for sinking (**kept auditable, not deleted**) |

This is exactly the five-layer diagnostic ontology (Observable Primitives → Evidence → Symptoms → Hypotheses → Conclusions): the upper layers are the on-stage protagonists, but each must have a thread tying it **back down** to the observable primitives below.

## 4. Foundations

- **Color = epistemic state** (not decoration). See amber and you know "anchored"; see blue and you know "the model just changed its mind." Full tokens in `packages/tokens/tokens.json` (the generated source of truth for every hex on this page). **And color is never the only channel**: every epistemic state must also be carried by text or shape — the state word on a badge, the ◆/◇ polarity glyph, the strikethrough on a sunk claim — so the contract survives color-blindness and grayscale. `StateDot` carries its state word for screen readers built-in.
- **Type = three voices.** Voice (cognition, serif Fraunces/Noto Serif) — thinking should look considered; UI (function, Hanken/Noto Sans) — clear and recessive; Evidence (instrument, IBM Plex Mono) — a verifiable reading.
- **Motion = the language of depth.** Surface (new understanding rises) / Settle (aqua turning to amber) / Sink (the refuted descends but is not deleted) / Pulse (an inflection flashes blue). Motion narrates state transitions, never mere decoration.

## 5. Component catalog

Rendered live by `@latent/react`, with props that are `@latent/schema` subtypes:
`<UnderstandingSurface>` · `<GroundedClaimCard>` · `<HypothesisCard>` · `<OpenQuestionCard>` · `<RefutedCard>` · `<InflectionMarker>` · `<ConfidenceMeter>` · `<EvidenceChips>` · `<ProvenanceView>` · `<ActivityStream>` · `<InterventionRail>` · `<PersonaToggle>` · `<ProportionalView>` · `<TraceView>` · `<Scenario>`.

## 6. Proportionality

The mass of the understanding surface scales with the **epistemic complexity of the problem**:

- **Low** (formatting, rewriting, single-step retrieval) → one grounded conclusion + provenance, no hypothesis board.
- **Mid** (drafting, comparison, planning) → 2–3 grounded claims + 1 open, lightweight.
- **High** (diagnosis, research, compliance investigation) → the full hypothesis board + inflections + sunk claims + provenance.

Don't put a hypothesis board on "rewrite this one sentence" (see anti-patterns).

## 7. Two personas

- **Operator view** (latent-led, default) → serves the end user.
- **Trace view** (tool-call-led) → serves debugging and audit.

A single toggle resolves the tension between "the transparency camp vs. cognition-first" — rather than forcing a choice between them.

## 8. The seven principles (shorthand)

1. Attention follows understanding, not activity.
2. The main stage admits only falsifiable cognition.
3. Surface inflections, sink narration.
4. Weakened ≠ hidden (provenance is always retrievable and reconstructable).
5. Uncertainty is first-class content.
6. Understanding persists, activity is transient.
7. Two personas, two views.

## 9. Trust calibration: verifiable vs asserted

Provenance must be tagged with a `mode`:

- **verifiable** — the evidence chain can be re-executed and verified (carries `reExecCmd`). TraceForge / coding / log-triage belong here.
- **asserted** — self-reported only, not cheaply re-executable (the device-graph correlation in financial compliance belongs here).

The UI must mark these differently so users can calibrate trust accordingly. Asserted conclusions should trigger human review.

## 10. Adoption red lines (these quietly rebuild theater)

- Pouring raw CoT straight onto the main stage (unfiltered by the contract).
- Faking "busy" with spinners/progress bars.
- Making confidence into ungrounded "vibe numbers."
- Deleting refuted hypotheses to look "clean."
- Forcing a hypothesis board onto a low-latent task.
- Folding provenance into a dead link that can't be retrieved.

## 11. Generalization: content roles (kind), applicable archetypes, and themes

**This is a general language, not diagnosis-specific.** Nodes have two orthogonal axes:

- `state` (epistemic stance, **encodes color**): grounded / hypothesis / open / inflection / refuted.
- `kind` (content role, **encodes the badge label**): observation / claim / decision / plan / requirement / option / tradeoff / answer / risk.

The Grounding Contract holds across archetypes: a **decision** or a **requirement understanding** that takes the main stage must equally be grounded (hung on criteria/evidence/the user's own words), or marked tentative (with a falsification condition), or left as an honest open. The "five-layer diagnostic ontology" above is merely the grounding ladder for the one domain of diagnosis; other archetypes have their own ladders, or need none.

| Archetype | Primary kind | latent |
|---|---|---|
| Diagnosis / root cause | claim | High |
| Planning / decision | decision · plan · tradeoff · risk | High |
| Authoring / generation | requirement · option · decision | Mid |
| Assistant / advice | answer · risk · tradeoff | Mid |
| Agentic action / ambient | decision (action) · plan (pending approval) · risk | High |
| RAD / full-stack app | requirement · decision · plan · option · risk | High |

**Themes**: `<html data-theme="dark|light|kami">` switches between dark (deep-sea blue), light (cool paper), and kami (warm parchment + indigo). Color still encodes epistemic state; the three themes are just value substitutions on the same-named semantic tokens — components must not hardcode hex.

## 12. Application layer: App Attention Grammar (macro)

The design language is not limited to components — it scales the three-zone model **up to the whole app**. Every agentic product is composed of five attention zones, and the visual weight is a hard rule:

| Zone | Role | Attention weight |
|---|---|---|
| **① Stage · Understanding** | the agent's continuously evolving, evidence-anchored understanding (use `<UnderstandingPanel>`) | main stage · highest · brightest |
| **② Artifact** | the object being built or operated on: code · canvas · video · document · data | on stage · neutral |
| **· Activity** | tool calls / render jobs / terminal | peripheral · auditable · collapsible |
| **· Context** | files / history | recessive |
| **③ Intervene** | human controls | first-class · always reachable |

Weight order: **Stage > Artifact > { Context, Activity }**; Intervention is always reachable.

**The macro inversion**: existing agentic products often put Activity (the tool-call stream) where the Stage belongs — this grammar moves *understanding* onto the main stage and demotes activity to the periphery.

**How to use it**: `@latent/react/app` provides the zone-role styles (`.zone-stage / .zone-artifact / .zone-activity / .zone-context / .zone-intervene` + `.app-frame / .app-topbar`); each app lays out these five zones with its own `grid-template-areas` and places `<UnderstandingPanel state={…}/>` in the Stage zone. Two reference implementations: `/apps/vibe-ide` (Vibe Coding IDE), `/apps/gen-studio` (Image/Video generation).

## 13. Motion under streaming (LLM streaming)

The core idea: **stream the *forming of understanding*, not a river of tokens.** See `/demos/streaming`.

- **The raw stream recedes to the periphery**: raw tokens and tool calls flow fast and ephemeral in the Activity zone, auditable; the main stage (understanding) updates on **meaningful commits**, not token-by-token jitter.
- **The motion vocabulary *is* the streaming dynamics**: Surface (a new judgement emerges) · Sink (a refuted hypothesis descends) · Pulse (a "changed my mind" inflection flashes) · Settle (an answer settles in from its placeholder).
- **The answer slot is a placeholder first**: before a conclusion is reached, "my judgement" is a placeholder slot (a faint "judging…"); on commit, Settle fills it in. Lifecycle: `thinking → forming → settled / revising`.
- **Stream events, not raw text**: prefer streaming patches `node.add / confidence.update / refute / inflection / outcome.settle`, which map naturally onto UI transitions and can distinguish "tentative" from "committed" — don't render an intermediate state that will be refuted as "fairly sure" too early (echoing the Grounding Contract).
- **Steady, not jittery**: debounce updates per semantic unit, reserve space to prevent reflow (CLS), respect `prefers-reduced-motion`. The raw stream may be fast; understanding must be steady.

## Integration checklist

- [ ] Model the agent's output as a `CognitiveState` instance first.
- [ ] `bun run validate` passes (the contract holds).
- [ ] latentLevel chosen honestly; `<ProportionalView>` auto-scales.
- [ ] Color/type drawn only from tokens.
- [ ] Every hypothesis carries a falsification; every grounded claim carries openable provenance.
- [ ] Provenance tagged verifiable / asserted.
- [ ] Refuted claims are sunk, not deleted.
