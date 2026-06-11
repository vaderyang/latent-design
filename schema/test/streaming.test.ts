/**
 * "Canned steps are a special case of streaming" — proven, not asserted:
 * every gold example, converted to a prerecorded event stream and folded
 * back through the reducer, must reproduce the instance and still pass the
 * Grounding Contract.
 */
import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import {
  CognitiveState,
  StreamingEvent,
  applyEvent,
  reduceStream,
  stateToEvents,
  validateStream,
} from "../src/index.ts";

const ROOT = new URL("../../", import.meta.url).pathname;

async function goldExamples(): Promise<{ file: string; state: CognitiveState }[]> {
  const out: { file: string; state: CognitiveState }[] = [];
  for await (const f of new Glob("examples/**/*.json").scan(ROOT)) {
    const parsed = CognitiveState.parse(JSON.parse(await Bun.file(ROOT + f).text()));
    out.push({ file: f, state: parsed });
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

describe("stateToEvents → reduceStream round-trip on every gold example", async () => {
  for (const { file, state } of await goldExamples()) {
    test(file, () => {
      const events = stateToEvents(state);
      for (const e of events) StreamingEvent.parse(e); // every event is itself contract-valid

      const reduced = reduceStream(events)!;
      expect(reduced).not.toBeNull();

      // the settled stream passes the full Grounding Contract
      const v = validateStream(events);
      expect(v.ok).toBe(true);

      // content round-trips exactly; node order becomes narrative-arrival order
      expect(reduced.task).toEqual(state.task);
      expect(reduced.latentLevel).toBe(state.latentLevel);
      expect(reduced.persona).toBe(state.persona);
      expect(reduced.userStory).toEqual(state.userStory);
      expect(reduced.observablePrimitives).toEqual(state.observablePrimitives);
      expect(reduced.toolCalls).toEqual(state.toolCalls);
      expect(reduced.outcome).toEqual(state.outcome);
      expect(reduced.steps).toEqual(state.steps);
      const byId = (nodes: CognitiveState["nodes"]) =>
        Object.fromEntries(nodes.map((n) => [n.id, n]));
      expect(byId(reduced.nodes)).toEqual(byId(state.nodes));
    });
  }
});

describe("the reducer narrates legal epistemic transitions", () => {
  const init: StreamingEvent = {
    type: "stream.init",
    schemaVersion: "0.2",
    latentLevel: "mid",
    persona: "operator",
    task: { title: "a forming understanding" },
  };
  const base = () =>
    reduceStream([
      init,
      { type: "primitive.add", primitive: { id: "op:1", kind: "tool-result", label: "measurement" } },
      { type: "toolcall.add", call: { id: "tc:1", ts: "—", fn: "measure", producedPrimitives: [] } },
      {
        type: "node.add",
        node: {
          id: "n:h",
          title: "a live hypothesis",
          state: "hypothesis",
          confidence: { value: 0.55, source: "self_consistency" },
          evidence: [],
          falsification: "re-running the measurement shows no drift",
        },
      },
    ])!;

  test("hypothesis settles into grounded (node.ground)", () => {
    const s = applyEvent(
      applyEvent(base(), {
        type: "node.evidence",
        nodeId: "n:h",
        evidence: { id: "e:1", label: "drift observed twice", primitives: ["op:1"], polarity: "supports" },
      }),
      {
        type: "node.ground",
        nodeId: "n:h",
        confidence: { value: 0.92, source: "self_consistency" },
        provenance: {
          mode: "verifiable",
          reExecCmd: "true",
          steps: [{ toolCallId: "tc:1", observed: "drift", primitives: ["op:1"] }],
        },
      },
    );
    const n = s.nodes[0];
    expect(n.state).toBe("grounded");
    expect(validateStream([])).toMatchObject({ ok: false });
    expect(CognitiveState.safeParse(s).success).toBe(true);
  });

  test("a refuted node keeps its former confidence and never disappears", () => {
    const s = applyEvent(base(), { type: "node.refute", nodeId: "n:h", reason: "measurement was an artifact" });
    expect(s.nodes).toHaveLength(1);
    const n = s.nodes[0];
    expect(n.state).toBe("refuted");
    expect(n.state === "refuted" && n.formerConfidence).toBe(0.55);
  });

  test("grounding without evidence is rejected by the reducer", () => {
    expect(() =>
      applyEvent(base(), {
        type: "node.ground",
        nodeId: "n:h",
        confidence: { value: 0.9, source: "self_report" },
        provenance: { mode: "asserted", steps: [{ toolCallId: "tc:1", observed: "x", primitives: ["op:1"] }] },
      }),
    ).toThrow(/no evidence/);
  });

  test("events before stream.init are incoherent", () => {
    expect(() => applyEvent(null, { type: "node.refute", nodeId: "n:x", reason: "y" })).toThrow(/before stream.init/);
  });
});
