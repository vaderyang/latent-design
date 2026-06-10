**English** · [中文](MISSION.zh.md)

This is a meaty design-strategy problem and the thesis "Latent is attentioned" is doing a lot of work, so let me ground the domain research properly before I build on it. Let me survey the current landscape of agentic UX.Strong signal already — notice the entire field frames reasoning as a *justification appended to actions* ("show the reasoning next to the action"). Let me check the adjacent threads: generative UI, ambient agents, and how products currently render "thinking."The key finding crystallizes the gap: even **Generative UI** — the field's cutting edge — is defined as *"connecting the results of a tool call to a React component."* The most advanced paradigm is still tool-call-*rooted*. Let me check two more things: how products currently render "thinking," and the faithfulness problem that will be central to my critique.I have what I need. The landscape research surfaces a sharp, useful picture — and a literature that almost names your thesis for you. Let me read the design skill before I build the deliverable, then give you the synthesis and the system together.The research is in, and it sharpens your thesis more than I expected. Here's the synthesis, then the system itself.

---

## I. Domain diagnosis: the whole field treats latent as a footnote to action

Lay out today's agentic UI and one structural fact is uniform across it: **almost every product is rooted in action/tool-call, and renders reasoning as an after-the-fact justification of the action.**

- The dominant paradigm is still the **ReAct-style thought-action-observation stream** — interleaving reasoning traces with action execution, originally meant to provide transparency for debugging and trust. But once it lands in the UI, reasoning gets compressed into a line of fine print beside the action. The current best practice is stated, over and over, as "show the reasoning briefly, right next to the action"; Smashing's pattern library even names it "Explainable Rationale" *after* the action — once an action happens, a good companion explains its reason. Note the ordering: **action first, explanation second.** Here, latent is an appendage to action.

- Even **Generative UI**, hyped as the next generation, is at bottom still tool-call-rooted. The industry's own definition is startlingly plain: "Generative UI is the process of connecting the result of a tool call to a React component." In other words, even in the most advanced paradigm, the UI's generative source is still tool output, not cognition itself. The entire disagreement among Vercel / CopilotKit / A2UI is only about *where the generated UI appears* (chat / canvas / chat-less inline) — none of them asks *whether cognition should be the subject.*

- The only thread that structurally loosens this root is the **ambient/background-agents** frontier. When an agent moves to an asynchronous background and you "come back to check" rather than "watch it work," the attention model is forced toward a *persistent state you revisit repeatedly* — and this autonomous, background-task-oriented paradigm only became possible in 2025, as long-horizon reasoning matured; it demands entirely new workflows and UI that did not exist before. That is precisely a tailwind for your thesis: **once actions have flowed past and state persists, the thing that genuinely deserves attention is that persisting "understanding."**

There's a recurring coincidence worth your attention: when the field discusses complex agentic flows, **the example reached for most often as canonical is network/system fault diagnosis** — an entire UX Magazine piece uses a flow in which a Supervisor Agent (also called the "Reasoning Agent") leads several Worker Agents to troubleshoot a system fault, find the root cause, and propose a fix. Your TraceForge sits squarely at the cognitively densest spot of this domain. Put differently: **you are not betting an aesthetic preference on an edge case — you are reallocating attention in the cognitive core of the field.**

---

## II. Driving the thesis home: the pun in "Latent is attentioned" and its strongest form

This neologism hides two meanings, both of which should be kept:

1. **Latent deserves attention** (the consumption side: a user's attention budget should go to cognition, not to the theater of tool execution).
2. **Latent is exactly where attention operates** (the mechanism side: the transformer's attention *is* that latent-space process). The UI should align the user's attention with the layer where the model's attention actually happens.

The strongest form, therefore, is not "display the model's thoughts," but:

> **Allocate the user's finite attention to the *latent structure of the problem* and the *agent's continuously evolving understanding of it* — not to the mechanical process of tool execution; let actions recede into provenance that can be retrieved on demand.**

---

## III. The fatal risk (this is the pivot on which the whole language succeeds or fails)

If you naively execute "put the model's thinking on stage," you will replace one problem with **something more dangerous than tool-call theater: reasoning theater.**

This is not a worry — it is a named, empirical phenomenon. There is a paper literally titled *Reasoning Theater*, and its core finding is that the chain-of-thought a model produces is often not its actual computation — whereas it is precisely the inflections, the backtracking, the sudden "aha" moments, the reconsiderations, that appear almost exclusively on problems where internal confidence undergoes a large shift, and these are faithful expressions of the resolution of internal uncertainty. The broader conclusion is brutal: CoT offers the *appearance* of transparency but does not amount to faithful interpretability; it is often post-hoc rationalization rather than a true reflection of the model's internal processing, and this unfaithfulness stems from a structural mismatch between the transformer's distributed, parallel computation and serialized, explicit reasoning. There is even a mechanistic finding: a "reasoning horizon" exists at roughly 70–85% of the chain, beyond which a reasoning token's causal influence on the final answer decays sharply.

To say it plainly: **the rendered latent ≠ the real latent.** What you see is a verbalized projection — a narrative that is sometimes fabricated after the fact, that may "look insightful while being entirely fictional." A perfectly self-consistent explanation may be wholly confabulated, while a flawed explanation may in fact reflect the model's real strategy. If your design language treats this narrative as the protagonist, the more beautifully you do it, **the more you are gilding unfaithful cognition with the lacquer of "trustworthy."** That directly destroys the trust you want — and in a financial setting it is a compliance disaster.

---

## IV. The solution (this is the real contribution, and what distinguishes this language from every existing approach)

Flip the risk above into a constraint, and your thesis is upgraded from "aesthetic preference" to "epistemic discipline":

**Only falsifiable, evidence-anchored cognition is worthy of occupying primary attention.** I call this the **Grounding Contract**. Any latent element that wants onto the main stage of "understanding" must be one of these three legal forms — otherwise it may not occupy primary attention:

| Form | Must carry | Visual weight |
|---|---|---|
| **Grounded claim** (an anchored conclusion) | openable provenance pointing to evidence / observable primitives | Highest (amber) |
| **Hypothesis** (a wager in play) | confidence + "what evidence would change it" | Medium (aqua) |
| **Open question** (an honest unknown) | what it needs to be resolved | Low but visible (indigo) |

The beauty of this contract is that it **is exactly your own five-layer diagnostic ontology** (Observable Primitives → Evidence → Symptoms → Hypotheses → Conclusions), and exactly your Popper/Lakatos stance: the upper layers of the ontology (hypotheses/conclusions) are the on-stage protagonists, but each must have a thread tying it **back down to the observable primitives** — no free-floating assertion. Reasoning theater is dangerous precisely because its narrative floats free; the Grounding Contract uses "must be falsifiable, must land on evidence" to keep free-floating narrative off the main stage.

On top of that, four further disciplines that grow directly out of the research:

1. **Surface inflections, not running narration.** The research says inflections (changes of mind, aha moments, refutations) are precisely the *most faithful*, highest-value part of the latent — so promote them to the stage and highlight them, while sinking procedural narration like "I'm reading a file / I'm calling search" (the breeding ground of unfaithfulness) to the periphery. Attention follows *what changed in the understanding*, not *which step was executed*.
2. **Provenance is always reconstructable (auditability is non-negotiable).** With a financial client, "which data did the agent touch" is a compliance question. Tool calls recede visually to the periphery, but must remain retrievable and auditable at all times. **Weakened ≠ hidden.**
3. **Proportionality.** "For all AI applications" means some tasks are cognitively shallow (formatting JSON, drafting an email). The mass of the understanding surface should scale with the *epistemic complexity of the problem* — don't put a hypothesis board on a trivial task.
4. **Two personas, two views.** The field's call for "let me see the tool calls" (transparency / control) is right — but that is the need of the *builder/debugger* persona. **Operator/end-user view = latent-led (default); Trace view = tool-call-led (entered for debugging/audit).** A single toggle resolves the tension between "the transparency camp vs. your thesis" — rather than forcing a choice between them.

---

What follows is the design language that puts all of this into practice. I did not write it as an ordinary markdown document — that would be ironic for this very subject. **I built it as a self-demonstrating design-language site: it is both the spec and a rendering of the language through your TraceForge diagnosis scenario.** The naming uses **Latent**, with its philosophical root in 「**潜**」(潜龙在渊 — cognition that is hidden but not yet expressed, and worthy of being seen).

Let me build it first.I see some stray tokens slipped into the CSS variables. Let me clean those up so the stylesheet is correct.Let me scan for any other stray tokens I may have introduced.Balanced and well-formed. Let me place it where you can open it.I built the system as a **self-demonstrating design-language site** rather than a markdown spec — given the thesis, a static document would have been ironic. Open it full-screen; it contains the full language: the inversion, the three-zone attention model, the Grounding Contract, the epistemic color/type/motion foundations, a live component library, the seven principles, voice rules, and anti-patterns — all anchored by a **steppable TraceForge diagnosis** (hit *Advance diagnosis* to watch a hypothesis sink, an inflection surface, and the root cause settle; toggle *Trace* to see the two-persona resolution). It embodies its own argument: cognition is the lit primary plane, tool calls recede to a peripheral, auditable rail, and color carries epistemic state rather than decoration.

Three things I want to flag honestly, because they're where this stops being a UX project and becomes *your core technical program*:

**1. The Grounding Contract reduces reasoning theater but doesn't eliminate it — and the residual is a backend problem, not a UI one.** A model can confabulate a *plausible evidence citation* too (cite the right PCAP for the wrong causal reason). The only real fix is *machine-verifiable grounding*: the evidence link should be re-executable. For TraceForge you often *can* re-run it — your fault-injection / verifiable-rewards infra is exactly that asset. For softer apps you can't. So your portfolio bifurcates into **verifiable-grounded** vs **asserted-grounded** apps, and the UI must label them differently so users calibrate trust correctly. That's a product decision, not a styling one.

**2. The latent-attentioned UX is *more honest on models you own* — which is a strategic argument for your cascade, not just a design choice.** Where do the rendered hypotheses/confidence/inflections come from? If the model merely *self-reports* them in its output, you're back in self-report territory (faithfulness-limited). If you derive confidence from logprobs/self-consistency and inflections from activation-space probes (the *Concept Walk*-style methods), it's far more faithful — but that needs model internals you have on your **own 0.8B/27B stack** and *don't* have through a frontier API. Your design language renders more truthfully on your distilled edge models than on Claude/GLM-5. That's a non-obvious synergy with your edge-deployment thesis worth making explicit to whoever funds it.

**3. This is a training target, not just a frontend spec.** If "Latent is attentioned" governs *all* your apps, your models must be *trained* to emit well-formed, calibrated, falsifiable cognitive state — honest confidence, real falsification conditions, no theater. That's a reward-shaping and SFT-data requirement landing squarely in TraceForge Lab. **The design language and the training objective are the same project.** I'd argue this is the biggest implication: you're not specifying a UI, you're specifying what your models must *learn to produce*, and the UI is just the honest readout of it.

If useful, the natural next artifacts are a second worked example in a different archetype (to pressure-test proportionality on a mid/low-latent app), or a component/token spec stripped for your front-end engineers. But I'd resolve the verifiable-vs-asserted grounding split first — it determines what the rest is built on.
