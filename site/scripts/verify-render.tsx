/** Throwaway verification: render every example through the real components and
 *  assert key markup. Covers the plain default (PlainView), the dense board
 *  (UnderstandingSurface), and the trace. Run from repo root:
 *    bun site/scripts/verify-render.tsx */
import { renderToString } from "react-dom/server";
import { createElement as h } from "react";
import { PlainView, UnderstandingSurface, TraceView } from "@latent/react";
import { CognitiveState } from "@latent/schema";

const root = new URL("../../", import.meta.url); // repo root

// plain-language markers that must appear in the default (English) view.
// Components default to English (getServerSnapshot → "en"), so renderToString
// yields the English plain reading.
const plainChecks: Record<string, string[]> = {
  "examples/traceforge.json": ["Your question", "My read", "Why I think so", "GC pause", "Where I changed my mind"],
  "examples/planning.json": ["Your question", "My read", "phased", "Where I changed my mind", "Still unsure"],
  "examples/writing.json": ["Your question", "My read", "three-column", "Still unsure"],
  "examples/advisory.json": ["Your question", "My read", "K8s", "Why I think so"],
  "examples/action.json": ["Your question", "My read", "phishing", "Still unsure"],
  "examples/rad-app.json": ["Your question", "My read", "state-machine"],
  "examples/gen-studio.json": ["Your question", "My read", "golden-hour"],
};

let fail = 0;
for (const [file, expect] of Object.entries(plainChecks)) {
  const parsed = CognitiveState.safeParse(JSON.parse(await Bun.file(new URL(file, root)).text()));
  if (!parsed.success) {
    console.log(`✗ ${file} — does not validate`);
    fail++;
    continue;
  }
  const plain = renderToString(h(PlainView, { state: parsed.data }));
  const board = renderToString(h(UnderstandingSurface, { state: parsed.data }));
  const trace = renderToString(h(TraceView, { toolCalls: parsed.data.toolCalls }));
  const missing = expect.filter((s) => !plain.includes(s));
  // certainty words must be present (no raw confidence numbers leaking to plain)
  const hasCertainty = /fairly sure|mostly sure|initial read|leaning yes|still weighing/.test(plain);
  const boardOk = board.length > 0 && /hcard/.test(board);
  const traceOk = trace.includes("Trace View");
  if (missing.length || !hasCertainty || !boardOk || !traceOk) {
    console.log(`✗ ${file} — missing: ${missing.join(", ")}${hasCertainty ? "" : " [no certainty word]"}${boardOk ? "" : " [board]"}${traceOk ? "" : " [trace]"}`);
    fail++;
  } else {
    console.log(`✓ ${file} — plain(${expect.length} markers + certainty word) · board · trace`);
  }
}

console.log(fail === 0 ? "\nALL RENDER CHECKS PASS" : `\n${fail} RENDER CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
