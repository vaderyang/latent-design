/** Throwaway verification: render every example through the real components and
 *  assert key markup. Covers the plain default (PlainView), the dense board
 *  (UnderstandingSurface), and the trace. Run from repo root:
 *    bun site/scripts/verify-render.tsx */
import { renderToString } from "react-dom/server";
import { createElement as h } from "react";
import { PlainView, UnderstandingSurface, TraceView } from "@latent/react";
import { CognitiveState } from "@latent/schema";

const root = new URL("../../", import.meta.url); // repo root

// plain-language markers that must appear in the default (简明) view
const plainChecks: Record<string, string[]> = {
  "examples/traceforge.json": ["你的问题", "我的判断", "我为什么这么看", "GC 长停顿", "我中途改了主意"],
  "examples/planning.json": ["你的问题", "我的判断", "分阶段", "我中途改了主意", "需要你定"],
  "examples/writing.json": ["你的问题", "我的判断", "三栏", "需要你定"],
  "examples/advisory.json": ["你的问题", "我的判断", "K8s", "我为什么这么看"],
  "examples/action.json": ["你的问题", "我的判断", "归档", "需要你定"],
  "examples/rad-app.json": ["你的问题", "我的判断", "状态机"],
  "examples/gen-studio.json": ["你的问题", "我的判断", "暖光"],
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
  const hasCertainty = /比较确定|大致确定|初步判断|倾向认为|还在判断/.test(plain);
  const boardOk = board.length > 0 && /hcard/.test(board);
  const traceOk = trace.includes("Trace View");
  if (missing.length || !hasCertainty || !boardOk || !traceOk) {
    console.log(`✗ ${file} — missing: ${missing.join(", ")}${hasCertainty ? "" : " [no certainty word]"}${boardOk ? "" : " [board]"}${traceOk ? "" : " [trace]"}`);
    fail++;
  } else {
    console.log(`✓ ${file} — plain(${expect.length} markers + 词级确定度) · board · trace`);
  }
}

console.log(fail === 0 ? "\nALL RENDER CHECKS PASS" : `\n${fail} RENDER CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
