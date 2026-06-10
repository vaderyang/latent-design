/** 潛 Minutes — an AI-native meeting-minutes app, shown LIVE.
 *
 *  The point is "latent": the agent is not a one-shot output after the meeting
 *  — it is an active state DURING it. Three planes:
 *    · Transcript (left)  — the ground truth, streaming in line by line
 *    · Draft (center, lit) — the minutes being continuously rewritten: a
 *      tentative decision firms up (cyan settles to gold), a mis-spoken TAM is
 *      struck through and corrected mid-meeting, owners fill in
 *    · Latent (right)     — the agent's live understanding: what it's tracking,
 *      research it launches, an inflection pulse, interim syntheses (阶段性小结)
 *
 *  Playback is a pure function of a demo clock (52 min compressed to ~72 s):
 *  pause / replay / skip are just clock operations. After the meeting ends the
 *  rail becomes the quiet support margin (needs-you items + full reading in a
 *  drawer). All mock; the final state mirrors examples/minutes.json (validated). */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CognitiveState } from "@latent/schema";
import { PlainView, useLang } from "@latent/react";
import type { InterventionAction } from "@latent/react";
import { Avatar, Button, Drawer, Disclosure, Toaster, useToast, StateDot, Mono, Spinner } from "@latent/react/kit";
import type { Tone } from "@latent/react/kit";
import dataEn from "@examples/minutes.json";
import dataZh from "@examples/minutes.zh.json";

const END = 72; // demo seconds for the 52-minute meeting

/* ------------------------------------------------------------- the script */
interface B {
  en: string;
  zh: string;
}
interface Ev {
  at: number; // demo-clock seconds
  tm: string; // meeting timestamp
  line?: { sp: string; t: B }; // a transcript line
  agent?: { kind: "focus" | "research" | "hypo" | "inflect" | "synth" | "promote" | "done"; t: B; runFor?: number };
  draft?: Partial<DraftFlags>;
}
interface DraftFlags {
  skeleton: boolean;
  decTentative: boolean;
  decFirm: boolean;
  tam: 0 | 1 | 2; // 1 = spoken $4.2B · 2 = corrected
  retention: 0 | 1 | 2; // 1 = stated · 2 = verified
  actions: number; // rows revealed
  weiOwner: boolean;
  budgetNote: boolean;
}
const D0: DraftFlags = { skeleton: false, decTentative: false, decFirm: false, tam: 0, retention: 0, actions: 0, weiOwner: false, budgetNote: false };

const EVENTS: Ev[] = [
  { at: 0.5, tm: "00:14", line: { sp: "Sarah Chen", t: { en: "Alright — Q3 roadmap. Three topics: Insights, the numbers, owners.", zh: "好——Q3 路线图。三件事：Insights、数字、责任人。" } },
    agent: { kind: "focus", t: { en: "Listening · building the agenda map (3 topics expected)", zh: "在听 · 构建议程图（预计 3 个议题）" } }, draft: { skeleton: true } },
  { at: 5, tm: "03:02", line: { sp: "Marcus Liu", t: { en: "Insights module — we're targeting September for v1.", zh: "Insights 模块——v1 目标定在 9 月。" } } },
  { at: 8, tm: "03:11", agent: { kind: "hypo", t: { en: "A ship-date decision is forming — holding it tentatively (no exact date yet)", zh: "一个上线日期的决策正在成形——先以暂定持有（还没有确切日期）" } }, draft: { decTentative: true } },
  { at: 12, tm: "07:40", line: { sp: "Elena Petrova", t: { en: "If September is real I need the staffing plan by next week.", zh: "如果 9 月是认真的，下周我就要人力排布。" } },
    agent: { kind: "focus", t: { en: "Commitment pattern → action item (owner: Elena, due next week)", zh: "承诺句式 → 行动项（owner：Elena，下周截止）" } }, draft: { actions: 2 } },
  { at: 18, tm: "18:24", line: { sp: "Tom Garcia", t: { en: "Market's there — TAM is $4.2B.", zh: "市场没问题——TAM 是 $4.2B。" } }, draft: { tam: 1 } },
  { at: 20, tm: "18:31", agent: { kind: "research", t: { en: "That figure feels stale — checking against the analyst deck…", zh: "这个数字像旧的——正在对照分析师报告核查…" }, runFor: 5 } },
  { at: 25, tm: "18:58", agent: { kind: "inflect", t: { en: "Conflict: deck v7 (May, source of record) says $3.1B. The spoken figure traces to the 2024 draft. Correcting the draft — original kept, sunk, for audit.", zh: "冲突：报告 v7（5 月，权威来源）是 $3.1B。口述数字来自 2024 旧稿。草稿已更正——原话沉降保留，可审计。" } }, draft: { tam: 2 } },
  { at: 31, tm: "24:10", line: { sp: "David Park", t: { en: "Q2 retention came in at 94.2%.", zh: "Q2 留存率落在 94.2%。" } }, draft: { retention: 1 } },
  { at: 33, tm: "24:18", agent: { kind: "research", t: { en: "Verifying against the warehouse (re-runnable query)…", zh: "正在对数据仓库验证（查询可重跑）…" }, runFor: 4 } },
  { at: 37, tm: "24:40", agent: { kind: "focus", t: { en: "Verified ✓ kpi.q2_retention = 0.942 — marked gold in the draft", zh: "已验证 ✓ kpi.q2_retention = 0.942——草稿中标金" } }, draft: { retention: 2 } },
  { at: 42, tm: "31:05", line: { sp: "Sarah Chen", t: { en: "Wei takes the vendor contract once budget clears.", zh: "预算批下来后，供应商合同由 Wei 来接。" } }, draft: { actions: 3 } },
  { at: 44, tm: "31:12", agent: { kind: "research", t: { en: "Who is “Wei”? CRM lookup…", zh: "“Wei”是谁？查询 CRM…" }, runFor: 4 } },
  { at: 48, tm: "31:40", agent: { kind: "hypo", t: { en: "Two matches. Holding: Zhang Wei (CFO office, owns budget approvals) at 0.62 — flip condition: calendar shows absence + Design owns the follow-up", zh: "两个匹配。暂持：张唯（CFO 办公室，负责预算审批）0.62——反转条件：日历显示未出席且跟进实际归设计部" } }, draft: { weiOwner: true } },
  { at: 51, tm: "32:02", agent: { kind: "focus", t: { en: "Note: the budget itself was referenced, never confirmed — keeping it honestly open", zh: "注意：预算本身只被提及、从未确认——作为诚实未决保留" } }, draft: { budgetNote: true } },
  { at: 55, tm: "35:00", agent: { kind: "synth", t: { en: "35 min in — 1 decision forming (date unconfirmed) · 3 actions · 1 figure corrected ($4.2B→$3.1B) · 1 verified · budget + one identity open", zh: "进行到 35 分钟——1 个决策成形中（日期未定）· 3 条行动 · 1 处数字已更正（$4.2B→$3.1B）· 1 处已验证 · 预算与一个身份未决" } } },
  { at: 60, tm: "41:32", line: { sp: "Sarah Chen", t: { en: "Lock it — Insights ships Sept 12. Scope is frozen.", zh: "就这么定——Insights 9 月 12 日上线。范围冻结。" } } },
  { at: 62, tm: "41:39", agent: { kind: "promote", t: { en: "The tentative ship-date just hardened: explicit date + scope + all three leads on record. Promoting to a grounded decision — cyan settles to gold.", zh: "暂定的上线日期刚刚坐实：明确日期 + 范围 + 三位负责人在录音中确认。提升为 grounded 决策——青转金凝定。" } }, draft: { decFirm: true } },
  { at: 66, tm: "47:21", line: { sp: "Tom Garcia", t: { en: "I'll get customer council invites out by July 1.", zh: "客户委员会邀请我 7 月 1 日前发出。" } }, draft: { actions: 6 } },
  { at: 69, tm: "51:48", line: { sp: "Sarah Chen", t: { en: "Good meeting. Minutes by end of day, please.", zh: "今天开得不错。纪要请在今天之内发出。" } } },
  { at: 71, tm: "52:00", agent: { kind: "done", t: { en: "Meeting ended. Minutes ready — every figure checked, 1 corrected; 2 confirmations pending before distribution.", zh: "会议结束。纪要就绪——数字全部核查、1 处更正；分发前还有 2 项待你确认。" } } },
];

const ACTION_ROWS: { item: B; owner: string; due: string; flag?: "hypo" | "unowned" }[] = [
  { item: { en: "Freeze Insights v1 spec & publish", zh: "冻结 Insights v1 规格并发布" }, owner: "Marcus Liu", due: "Jun 13" },
  { item: { en: "Staffing plan for the Sept ship date", zh: "为 9 月上线排人力" }, owner: "Elena Petrova", due: "Jun 17" },
  { item: { en: "Vendor contract — gated by budget sign-off", zh: "供应商合同——卡在预算审批" }, owner: "Zhang Wei ?", due: "Jun 20", flag: "hypo" },
  { item: { en: "Pricing one-pager", zh: "定价一页纸" }, owner: "—", due: "Jun 24", flag: "unowned" },
  { item: { en: "Retention deep-dive with corrected TAM", zh: "用更正后的 TAM 做留存深析" }, owner: "David Park", due: "Jun 27" },
  { item: { en: "Customer council invites", zh: "客户委员会邀请" }, owner: "Tom Garcia", due: "Jul 01" },
];

const ATTENDEES = [
  { name: "Sarah Chen", role: { en: "CEO", zh: "CEO" } },
  { name: "Marcus Liu", role: { en: "CPO", zh: "CPO" } },
  { name: "Elena Petrova", role: { en: "Eng Lead", zh: "研发负责人" } },
  { name: "David Park", role: { en: "Data Lead", zh: "数据负责人" } },
  { name: "Tom Garcia", role: { en: "Sales", zh: "销售" } },
  { name: "You", role: { en: "Chief of Staff", zh: "幕僚长" } },
];

const AGENT_DOT: Record<string, Tone> = {
  focus: "neutral",
  research: "hypothesis",
  hypo: "hypothesis",
  inflect: "inflection",
  synth: "open",
  promote: "grounded",
  done: "grounded",
};

function meetingClock(c: number): string {
  const m = (c / END) * 52;
  const mm = Math.floor(m);
  const ss = Math.floor((m - mm) * 60);
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function App() {
  const zh = useLang() === "zh";
  const t = (en: string, zhs: string) => (zh ? zhs : en);
  const b = (x: B) => (zh ? x.zh : x.en);
  const toast = useToast();

  const parsed = CognitiveState.safeParse(zh ? dataZh : dataEn);
  if (!parsed.success) return <div className="contract-error">✗ invalid CognitiveState</div>;
  const state = parsed.data;

  // ---- playback: everything derives from one clock ----
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [clock, setClock] = useState(reduce ? END : 0);
  const [playing, setPlaying] = useState(!reduce);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    if (!playing || clock >= END) return;
    const id = setInterval(() => setClock((c) => Math.min(END, c + 0.1)), 100);
    return () => clearInterval(id);
  }, [playing, clock >= END]);

  const fired = EVENTS.filter((e) => e.at <= clock);
  const lines = fired.filter((e) => e.line);
  const feed = fired.filter((e) => e.agent);
  const done = clock >= END;
  const draft = fired.reduce<DraftFlags>((d, e) => (e.draft ? { ...d, ...e.draft } : d), D0);

  // autoscroll the transcript
  const tsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tsRef.current?.scrollTo({ top: tsRef.current.scrollHeight, behavior: "smooth" });
  }, [lines.length]);

  const approve = () =>
    toast({ title: t("Minutes distributed", "纪要已分发"), body: t("Sent to 6 attendees · audit trail attached", "已发送给 6 位与会者 · 附审计链"), tone: "grounded" });
  const confirmWei = () =>
    toast({ title: t("Identity confirmed", "身份已确认"), body: t("“Wei” → Zhang Wei (CFO office)", "“Wei”→ 张唯（CFO 办公室）"), tone: "grounded" });
  const askCfo = () =>
    toast({ title: t("Sent to CFO office", "已发送 CFO 办公室"), body: t("Asked to confirm the $120k Q3 budget", "请其确认 Q3 的 $120k 预算"), tone: "hypothesis" });

  const drawerActions: InterventionAction[] = [
    { label: t("Approve & distribute", "批准并分发"), variant: "primary", onAct: approve },
    { label: t("Confirm Zhang Wei", "确认张唯身份"), onAct: confirmWei },
    { label: t("Ask CFO office", "询问 CFO 办公室"), onAct: askCfo },
  ];

  const visibleActions = ACTION_ROWS.slice(0, draft.actions);

  return (
    <div className="app-frame app-minutes">
      {/* ---- top chrome: the recording is the context ---- */}
      <div className="app-topbar">
        <div className="brand">
          <span className="mk-brand">潛 Minutes</span>
          {t("Q3 Roadmap Review", "Q3 路线图评审")}
        </div>
        <div className="rec-wrap">
          <span className={`rec-dot${done ? " off" : playing ? "" : " paused"}`} />
          <Mono style={{ fontSize: 11, color: done ? "var(--ink-500)" : "var(--ink-300)" }}>
            {done ? t("ended · 52:00", "已结束 · 52:00") : `${t("REC", "录制中")} ${meetingClock(clock)} / 52:00`}
          </Mono>
          {!done && (
            <button type="button" className="rec-btn" onClick={() => setPlaying((p) => !p)}>
              {playing ? "⏸" : "▶"}
            </button>
          )}
          <button type="button" className="rec-btn" onClick={() => { setClock(0); setPlaying(true); }} title={t("replay", "重放")}>↻</button>
          {!done && (
            <button type="button" className="rec-btn" onClick={() => setClock(END)} title={t("skip to end", "跳到结尾")}>⏭</button>
          )}
        </div>
        <div className="tright">
          <span className={`status-pill${done ? "" : " live"}`}>
            {done ? t("Ready · 2 confirmations pending", "就绪 · 2 项待确认") : t("drafting live…", "草稿生成中…")}
          </span>
          <Button size="sm" variant="primary" onClick={approve} disabled={!done}>{t("Approve", "批准")}</Button>
        </div>
      </div>

      {/* ---- · Transcript — ground truth, streaming (peripheral but alive) ---- */}
      <div className="zone zone-ts">
        <div className="zone-head">· {t("Transcript · live", "转录 · 实时")}</div>
        <div className="ts-scroll" ref={tsRef}>
          {lines.map((e, i) => (
            <div className="ts-line" key={i}>
              <Avatar name={e.line!.sp} size="sm" />
              <div className="ts-body">
                <div className="ts-meta">
                  <span className="ts-sp">{e.line!.sp}</span>
                  <span className="ts-tm">{e.tm}</span>
                </div>
                <div className="ts-text">{b(e.line!.t)}</div>
              </div>
            </div>
          ))}
          {!done && playing && <div className="ts-cursor"><span className="shimmer-dot" /><span className="shimmer-dot" /><span className="shimmer-dot" /></div>}
        </div>
      </div>

      {/* ---- ① Draft — the minutes, continuously rewritten (the lit plane) ---- */}
      <div className="zone zone-doc">
        <div className="zone-head">
          ① {t("Draft · rewrites as the meeting unfolds", "草稿 · 随会议进行不断改写")}
          {!done && <span className="zn drafting">{t("v0 → forming", "v0 → 成形中")}</span>}
        </div>
        <div className="doc">
          {!draft.skeleton ? (
            <div className="doc-empty">{t("● Recording starts — the draft will form here", "● 录制开始——草稿将在这里成形")}</div>
          ) : (
            <>
              <div className="doc-title lk-reveal lk-reveal--surface">{t("Minutes — Q3 Roadmap Review", "会议纪要 — Q3 路线图评审")}</div>
              <div className="doc-meta">2026-06-10 · 10:00–10:52 · {t("recorded & diarized", "已录音并分轨")}</div>
              <div className="people">
                {ATTENDEES.map((p) => (
                  <span className="person" key={p.name}>
                    <Avatar name={p.name} size="sm" />
                    <span className="pname">{p.name}</span>
                    <span className="prole">{b(p.role)}</span>
                  </span>
                ))}
              </div>

              <div className="doc-h">{t("1 · Decisions", "1 · 决策")}</div>
              {!draft.decTentative ? (
                <p className="doc-pending">{t("— listening for commitments —", "— 正在捕捉承诺 —")}</p>
              ) : draft.decFirm ? (
                <p key="firm" className="lk-reveal lk-reveal--settle">
                  <span className="mk mk-g">{t("The Insights module ships Sept 12; v1 scope is frozen", "Insights 模块 9 月 12 日上线；v1 范围冻结")}</span>
                  {t(" — committed at 41:32, all three leads on record.", "——41:32 拍板，三位负责人均在录音中确认。")}
                </p>
              ) : (
                <p key="tent" className="lk-reveal lk-reveal--surface">
                  <span className="mk mk-h">{t("Insights v1 targets September (exact date not yet committed)", "Insights v1 目标 9 月（确切日期尚未拍板）")}</span>
                  <span className="doc-tag">{t("tentative · held by the agent", "暂定 · agent 持有中")}</span>
                </p>
              )}

              {(draft.tam > 0 || draft.retention > 0) && <div className="doc-h">{t("2 · Data points", "2 · 数据要点")}</div>}
              {draft.tam === 1 && (
                <p className="lk-reveal lk-reveal--surface">
                  {t("Market: ", "市场：")}
                  <span className="mk mk-h">TAM $4.2B</span>
                  <span className="doc-tag">{t("checking…", "核查中…")}</span>
                </p>
              )}
              {draft.tam === 2 && (
                <p key="tamfix" className="lk-reveal lk-reveal--surface">
                  {t("Market: ", "市场：")}
                  <span className="mk mk-r">{t("TAM $4.2B (as spoken, 18:24)", "TAM $4.2B（会上口述，18:24）")}</span>{" "}
                  <span className="mk mk-i">{t("→ $3.1B per analyst deck v7 (May)", "→ 依分析师报告 v7（5 月）为 $3.1B")}</span>
                  {t(" — corrected mid-meeting.", "——会议进行中已更正。")}
                </p>
              )}
              {draft.retention === 1 && (
                <p className="lk-reveal lk-reveal--surface">
                  <span className="mk mk-h">{t("Q2 retention 94.2%", "Q2 留存率 94.2%")}</span>
                  <span className="doc-tag">{t("verifying…", "验证中…")}</span>
                </p>
              )}
              {draft.retention === 2 && (
                <p key="retok" className="lk-reveal lk-reveal--settle">
                  <span className="mk mk-g">{t("Q2 retention is 94.2%", "Q2 留存率为 94.2%")}</span>
                  {t(" — verified against the warehouse (re-runnable).", "——已对数据仓库核实（可重跑）。")}
                </p>
              )}

              {draft.actions > 0 && (
                <>
                  <div className="doc-h">
                    {t("3 · Action items", "3 · 行动项")}
                    <span className="doc-h-sub">{done ? t("6 extracted · 1 unowned", "提取 6 条 · 1 条无人认领") : `${visibleActions.length} ${t("so far", "条（持续提取）")}`}</span>
                  </div>
                  <table className="lk-table doc-acts">
                    <thead>
                      <tr><th style={{ width: 36 }}>#</th><th>{t("action item", "行动项")}</th><th style={{ width: 130 }}>owner</th><th style={{ width: 70 }}>due</th></tr>
                    </thead>
                    <tbody>
                      {visibleActions.map((r, i) => (
                        <tr key={i} className="lk-reveal lk-reveal--surface">
                          <td className="lk-cell--mono">{i + 1}</td>
                          <td>{b(r.item)}</td>
                          <td>
                            {r.flag === "unowned" ? (
                              <span className="own own-o">{t("unowned", "无人认领")}</span>
                            ) : r.flag === "hypo" ? (
                              draft.weiOwner ? <span className="own own-h">Zhang Wei ?</span> : <span className="own own-o">{t("pending", "待定")}</span>
                            ) : (
                              r.owner
                            )}
                          </td>
                          <td className="lk-cell--mono">{r.due}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {draft.budgetNote && (
                    <p className="doc-foot lk-reveal lk-reveal--surface">
                      {t("Item #3 is ", "第 3 条")}
                      <span className="mk mk-o">{t("gated by a budget sign-off that was referenced but never confirmed", "卡在一笔被提及但从未确认的预算审批上")}</span>
                      {t("; its owner hinges on ", "；其 owner 取决于")}
                      <span className="mk mk-h">{t("whether “Wei” is Zhang Wei of the CFO office (0.62)", "“Wei”是否为 CFO 办公室的张唯（0.62）")}</span>
                      {t(".", "。")}
                    </p>
                  )}
                </>
              )}

              {done && (
                <div className="legend lk-reveal lk-reveal--surface">
                  <span><StateDot state="grounded" size="sm" /> {t("anchored", "已锚定")}</span>
                  <span><StateDot state="hypothesis" size="sm" /> {t("held with uncertainty", "不确定持有")}</span>
                  <span><StateDot state="open" size="sm" /> {t("needs you", "需要你定")}</span>
                  <span><StateDot state="inflection" size="sm" /> {t("corrected", "已更正")}</span>
                  <span><StateDot state="refuted" size="sm" /> {t("as spoken, retracted", "口述原文，已撤回")}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---- · Latent — the agent's live understanding (in support) ---- */}
      <div className="zone zone-agent">
        <div className="zone-head">· {t("Latent · the agent, live", "Latent · agent 进行时")}</div>

        {done && (
          <div className="rail-after lk-reveal lk-reveal--surface">
            <div className="rail-group">{t("Needs you", "需要你定")} · 2</div>
            <div className="rail-item open">
              <div className="rail-head as-static"><StateDot state="hypothesis" size="sm" /><span className="rail-title">{t("Is “Wei” Zhang Wei (CFO office)?", "“Wei”是张唯（CFO 办公室）吗？")}</span><span className="rail-meta">0.62</span></div>
              <div className="rail-body">
                <div className="rail-acts">
                  <Button size="sm" onClick={confirmWei}>{t("It's Zhang Wei", "是张唯")}</Button>
                  <Button size="sm" variant="ghost" onClick={() => toast({ title: t("Flipped", "已反转"), body: t("Owner reassigned to Wei Lin (Design)", "owner 改为林薇（设计部）"), tone: "inflection" })}>{t("It's Wei Lin", "是林薇")}</Button>
                </div>
              </div>
            </div>
            <div className="rail-item open">
              <div className="rail-head as-static"><StateDot state="open" size="sm" /><span className="rail-title">{t("Budget sign-off unconfirmed", "预算审批未确认")}</span></div>
              <div className="rail-body">
                <div className="rail-acts">
                  <Button size="sm" onClick={askCfo}>{t("Ask CFO office", "询问 CFO 办公室")}</Button>
                </div>
              </div>
            </div>
            <button type="button" className="rail-full" onClick={() => setDrawer(true)}>{t("Full understanding ▸", "完整理解 ▸")}</button>
            <div className="rail-divider">{t("session latent log", "本场 latent 日志")}</div>
          </div>
        )}

        <div className="feed">
          {[...feed].reverse().map((e, ri) => {
            const i = feed.length - 1 - ri;
            const a = e.agent!;
            const running = a.kind === "research" && a.runFor != null && clock < e.at + a.runFor;
            return (
              <div key={i} className={`feed-item feed-${a.kind}${i === feed.length - 1 && !done ? " lk-reveal lk-reveal--surface" : ""}`}>
                <span className="feed-rail">
                  {running ? <Spinner size="sm" /> : <StateDot state={AGENT_DOT[a.kind] ?? "neutral"} size="sm" />}
                </span>
                <div className="feed-body">
                  <div className="feed-meta">
                    <Mono style={{ fontSize: 9.5, color: "var(--ink-600)" }}>{e.tm}</Mono>
                    <span className="feed-kind">{
                      a.kind === "research" ? t("research", "调研") :
                      a.kind === "hypo" ? t("holding", "暂持") :
                      a.kind === "inflect" ? t("changed my mind", "改了主意") :
                      a.kind === "synth" ? t("interim synthesis", "阶段性小结") :
                      a.kind === "promote" ? t("promoted", "已提升") :
                      a.kind === "done" ? t("wrap-up", "收束") : t("tracking", "跟踪")
                    }</span>
                  </div>
                  <div className="feed-text">{b(a.t)}{running && "…"}</div>
                </div>
              </div>
            );
          })}
          {feed.length === 0 && <div className="feed-empty">{t("— the agent wakes with the recording —", "— agent 随录音一同苏醒 —")}</div>}
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={t("The agent's full understanding", "agent 的完整理解")}>
        <PlainView state={state} actions={drawerActions} showProblem={false} />
      </Drawer>
    </div>
  );
}

export default function MinutesApp() {
  return (
    <Toaster>
      <App />
    </Toaster>
  );
}
