/**
 * i18n for @latent/react — bilingual (English default · 中文) chrome strings.
 *
 * The active language is driven by `document.documentElement.dataset.lang`
 * ("en" | "zh"), set before paint by the host page (see the site's Base layout)
 * and toggled at runtime. The toggle dispatches a `latent-langchange` window
 * event; `useLang()` subscribes so every island re-renders on switch.
 *
 * English is the canonical default: when no lang is set (or during SSR) the
 * components read English.
 *
 * Note this dictionary covers the component *chrome* only — the cognitive
 * content itself (titles, evidence, goals …) lives in the CognitiveState data,
 * which the host swaps per language (see the site's DemoFrame).
 */
import { useSyncExternalStore } from "react";
import type { NodeKind, Inflection, Confidence } from "@latent/schema";

export type Lang = "en" | "zh";

export const LANG_EVENT = "latent-langchange";

/** Read the active language from the document (English when absent / on server). */
export function getLang(): Lang {
  if (typeof document !== "undefined") {
    return document.documentElement.dataset.lang === "zh" ? "zh" : "en";
  }
  return "en";
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LANG_EVENT, cb);
  return () => window.removeEventListener(LANG_EVENT, cb);
}

/** Reactive current language; re-renders the component when the language switches. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => "en");
}

type Tone = "firm" | "lean" | "open" | "out";

const en = {
  // ---- plain-language reading (PlainView) ----
  plain: {
    problem: "Your question",
    judgement: "My read",
    suggestion: "→ My suggestion: ",
    why: "Why I think so",
    changedMind: "Where I changed my mind",
    inflectBefore: "I first thought ",
    inflectAfter: ", then realised ",
    inflectEnd: ". ",
    unsure: "Still unsure / for you to decide",
    collapse: "collapse",
    howIKnow: "how I confirmed this ▾",
    verifiable: "This one can be re-checked — there is a re-runnable verification.",
    asserted: "This is my read from the information at hand; it can't be auto-verified yet.",
    nextYouCan: "What you can do next",
    ruledOut: (n: number) => `I considered but ruled out ${n} idea${n > 1 ? "s" : ""} ▾`,
    ruledOutSep: " — ",
    because: (parts: string[]) => `Because ${parts.join("; ")}.`,
    sentenceEnd: ". ",
  },
  // ---- certainty words (plain reading) ----
  certainty: {
    firmHigh: { word: "fairly sure", tone: "firm" as Tone },
    firmMid: { word: "mostly sure", tone: "firm" as Tone },
    leanInitial: { word: "initial read", tone: "lean" as Tone },
    leanYes: { word: "leaning yes", tone: "lean" as Tone },
    leanWeigh: { word: "still weighing", tone: "lean" as Tone },
    initial: { word: "initial", tone: "lean" as Tone },
  },
  // ---- Scenario shell ----
  scenario: {
    accept: "Accept",
    pushback: "Push back",
    addConstraint: "Add goal / constraint",
    viewPlain: "Plain",
    viewDetail: "Detail",
    viewDev: "Developer",
    triggerLabel: "Trigger · ",
    goalLabel: "Goal · ",
    youSee: "What you see here",
    youCanDo: "What you can do here",
    traceNote:
      "One session, one truth, three readings. Plain for the domain user; Detail for those who want the machinery; Developer for execution & audit.",
    understandingLabel: "① Understanding · what the agent currently holds",
    replayCount: (cur: number, max: number) => `Replay ${cur} / ${max}`,
    replayCta: "▸ Replay: watch this understanding form, step by step",
    replayNote: "For demo · in real use the agent advances on its own",
    prev: "◂ Prev",
    next: "Next ▸",
    seeFull: "↺ See full result",
    seeFullTitle: "Back to the final result",
    activityLabel: "② Activity · peripheral (auditable)",
    youCanDoShort: "③ What you can do",
  },
  // ---- node cards ----
  kind: {
    observation: "Observation",
    claim: "Claim",
    decision: "Decision",
    plan: "Plan",
    requirement: "Requirement",
    option: "Option",
    tradeoff: "Tradeoff",
    answer: "Answer",
    risk: "Risk",
  } as Record<NodeKind, string>,
  state: { grounded: "Grounded", hypothesis: "Hypothesis", open: "Open", refuted: "Refuted" },
  inflect: {
    prefix: "Inflection · ",
    backtrack: "Backtrack",
    aha: "Aha",
    refutation: "Refutation",
  } as { prefix: string } & Record<Inflection["inflectKind"], string>,
  open: { toResolve: "To resolve" },
  refuted: { whySank: "Why it sank", wasConf: (c: string) => ` (was conf ${c})` },
  // ---- activity / trace ----
  activity: {
    expanded: "expanded · click to collapse",
    collapsed: "collapsed · click to expand",
    traceLabel: "Trace View · builder / audit persona — here the tool calls are the subject",
  },
  // ---- primitives ----
  prim: {
    whatWouldChange: "What would change it",
    provenanceLabel: "provenance · observable primitives",
    verifiable: "◆ verifiable · re-runnable check",
    asserted: "○ asserted · self-reported",
  },
  // ---- panel ----
  panel: { outcome: "Outcome", suggestion: " Suggestion: ", youCanDo: "③ What you can do" },
  // ---- proportionality ----
  level: {
    low: "Low latent · direct task — the surface collapses to one grounded line + provenance",
    mid: "Mid latent · multi-step synthesis — 2–3 grounded claims + 1 open",
    high: "High latent · diagnosis / research — full hypothesis board + inflections + sinks + provenance",
  },
  // ---- live playback (latent is a process) ----
  live: {
    forming: "forming…",
    formingAnswer: "still forming — don't trust me yet…",
    settled: "settled",
    pause: "pause",
    play: "play",
    replay: "replay",
    skip: "skip to end",
  },
};

export type Strings = typeof en;

const zh: Strings = {
  plain: {
    problem: "你的问题",
    judgement: "我的判断",
    suggestion: "→ 我的建议：",
    why: "我为什么这么看",
    changedMind: "我中途改了主意",
    inflectBefore: "原本以为",
    inflectAfter: "，后来发现",
    inflectEnd: "。",
    unsure: "我还不确定 / 需要你定",
    collapse: "收起",
    howIKnow: "我是怎么确认的 ▾",
    verifiable: "这一条可以复核（有可重跑的验证）。",
    asserted: "这一条是我根据已有信息的判断，暂不能自动复核。",
    nextYouCan: "接下来你可以",
    ruledOut: (n: number) => `我考虑过但排除了 ${n} 个想法 ▾`,
    ruledOutSep: " —— ",
    because: (parts: string[]) => `因为${parts.join("；")}。`,
    sentenceEnd: "。",
  },
  certainty: {
    firmHigh: { word: "比较确定", tone: "firm" },
    firmMid: { word: "大致确定", tone: "firm" },
    leanInitial: { word: "初步判断", tone: "lean" },
    leanYes: { word: "倾向认为", tone: "lean" },
    leanWeigh: { word: "还在判断", tone: "lean" },
    initial: { word: "初步", tone: "lean" },
  },
  scenario: {
    accept: "采纳",
    pushback: "提出异议",
    addConstraint: "补充目标 / 约束",
    viewPlain: "简明",
    viewDetail: "详细",
    viewDev: "开发者",
    triggerLabel: "触发 · ",
    goalLabel: "目标 · ",
    youSee: "你在这里看到",
    youCanDo: "你在这里可做",
    traceNote: "同一会话、同一真相，三种读法。简明给业务用户；详细给想看机制的人；开发者看执行与审计。",
    understandingLabel: "① 理解态 · agent 当前的理解",
    replayCount: (cur: number, max: number) => `回放 ${cur} / ${max}`,
    replayCta: "▸ 回放：看这份理解如何一步步形成",
    replayNote: "演示用 · 真实使用中 agent 自动推进",
    prev: "◂ 上一步",
    next: "下一步 ▸",
    seeFull: "↺ 看完整结果",
    seeFullTitle: "回到最终结果",
    activityLabel: "② 动作流 · 外围（可审计）",
    youCanDoShort: "③ 你可以做什么",
  },
  kind: {
    observation: "观察",
    claim: "论断",
    decision: "决定",
    plan: "计划",
    requirement: "需求",
    option: "选项",
    tradeoff: "权衡",
    answer: "回答",
    risk: "风险",
  },
  state: { grounded: "Grounded", hypothesis: "Hypothesis", open: "Open", refuted: "Refuted" },
  inflect: {
    prefix: "Inflection · 拐点 / ",
    backtrack: "回退",
    aha: "啊哈",
    refutation: "推翻",
  },
  open: { toResolve: "待解决" },
  refuted: { whySank: "为何沉降", wasConf: (c: string) => `（曾 conf ${c}）` },
  activity: {
    expanded: "展开 · 点击收起",
    collapsed: "收起中 · 点击展开",
    traceLabel: "Trace View · builder / 审计人格 — 此处 tool-call 才是主体",
  },
  prim: {
    whatWouldChange: "什么会改变它",
    provenanceLabel: "provenance · 可观测原语",
    verifiable: "◆ verifiable · 可重执行验证",
    asserted: "○ asserted · 仅自报",
  },
  panel: { outcome: "结果", suggestion: " 建议：", youCanDo: "③ 你可以做什么" },
  level: {
    low: "Low latent · 直接任务 — 理解态退化为一行 grounded 结论 + provenance",
    mid: "Mid latent · 多步综合 — 2–3 个 grounded 论点 + 1 个 open",
    high: "High latent · 诊断/研究 — 完整假设板 + 拐点 + 沉降 + 溯源",
  },
  live: {
    forming: "形成中…",
    formingAnswer: "正在判断，先别急着信我…",
    settled: "已凝定",
    pause: "暂停",
    play: "播放",
    replay: "重放",
    skip: "跳到结尾",
  },
};

export const STRINGS: Record<Lang, Strings> = { en, zh };

/** Reactive strings for the active language. */
export function useStrings(): Strings {
  return STRINGS[useLang()];
}

/** Map a grounded/hypothesis confidence to a plain-language certainty word. */
export function certaintyWord(
  state: "grounded" | "hypothesis",
  confidence: number,
  t: Strings,
): { word: string; tone: Tone } {
  if (state === "grounded") {
    if (confidence >= 0.85) return t.certainty.firmHigh;
    if (confidence >= 0.7) return t.certainty.firmMid;
    return t.certainty.leanInitial;
  }
  return confidence >= 0.5 ? t.certainty.leanYes : t.certainty.leanWeigh;
}

export type { Confidence };
