/** 潛 Minutes — an AI-native meeting-minutes app, saturated in the design
 *  language. The agent's understanding of the meeting (decisions · verified
 *  figures · people · open items) is the lit Stage; the minutes document is
 *  the Artifact — and the document itself carries the epistemics: every
 *  highlighted span is pinned to a cognitive node. Click a span → the Stage
 *  switches to the board and pulses that node. All mock data; the Stage is
 *  driven by a validated CognitiveState instance (examples/minutes.json). */
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { CognitiveState } from "@latent/schema";
import { PlainView, CognitiveNodeView, OutcomeBanner, InterventionRail, orderNodes, useLang } from "@latent/react";
import type { InterventionAction } from "@latent/react";
import { Badge, Tag, Avatar, Table, Button, Segmented, Toaster, useToast, StateDot, Mono } from "@latent/react/kit";
import type { Column } from "@latent/react/kit";
import dataEn from "@examples/minutes.json";
import dataZh from "@examples/minutes.zh.json";

/* ---------------------------------------------------------- mock people */
interface Person {
  name: string;
  role: string;
  roleZh: string;
  state?: "hypothesis";
  note?: string;
  noteZh?: string;
}
const ATTENDEES: Person[] = [
  { name: "Sarah Chen", role: "CEO", roleZh: "CEO" },
  { name: "Marcus Liu", role: "CPO", roleZh: "CPO" },
  { name: "Elena Petrova", role: "Eng Lead", roleZh: "研发负责人" },
  { name: "David Park", role: "Data Lead", roleZh: "数据负责人" },
  { name: "Tom Garcia", role: "Sales", roleZh: "销售" },
  { name: "You", role: "Chief of Staff", roleZh: "幕僚长" },
];
const MENTIONED: Person = {
  name: "Zhang Wei",
  role: "CFO office · mentioned",
  roleZh: "CFO 办公室 · 被提及",
  state: "hypothesis",
  note: "identity 0.62 · confirm",
  noteZh: "身份 0.62 · 待确认",
};

/* ------------------------------------------------------ mock action items */
interface ActionRow {
  id: number;
  item: string;
  itemZh: string;
  owner: string;
  due: string;
  flag?: "open" | "hypo" | "unowned";
}
const ACTIONS: ActionRow[] = [
  { id: 1, item: "Freeze Insights v1 spec & publish", itemZh: "冻结 Insights v1 规格并发布", owner: "Marcus Liu", due: "Jun 13" },
  { id: 2, item: "Staffing plan for Sept 12 ship date", itemZh: "为 9 月 12 日上线排人力", owner: "Elena Petrova", due: "Jun 17" },
  { id: 3, item: "Vendor contract — gated by budget sign-off", itemZh: "供应商合同——卡在预算审批", owner: "Zhang Wei ?", due: "Jun 20", flag: "hypo" },
  { id: 4, item: "Pricing one-pager", itemZh: "定价一页纸", owner: "—", due: "Jun 24", flag: "unowned" },
  { id: 5, item: "Retention deep-dive with corrected TAM", itemZh: "用更正后的 TAM 做留存深析", owner: "David Park", due: "Jun 27" },
  { id: 6, item: "Customer council invites", itemZh: "客户委员会邀请", owner: "Tom Garcia", due: "Jul 01" },
];

/* ---------------------------------------------------------------- doc marks */
type MarkTone = "g" | "h" | "o" | "i" | "r";

function App() {
  const zh = useLang() === "zh";
  const t = (en: string, zhs: string) => (zh ? zhs : en);
  const toast = useToast();

  const parsed = CognitiveState.safeParse(zh ? dataZh : dataEn);
  if (!parsed.success) return <div className="contract-error">✗ invalid CognitiveState</div>;
  const state = parsed.data;

  const [view, setView] = useState<"plain" | "board">("plain");
  const [pulse, setPulse] = useState<{ id: string; n: number }>({ id: "", n: 0 });
  const [replay, setReplay] = useState(0); // 0 = off, 1..steps = step
  const stageRef = useRef<HTMLDivElement>(null);

  const steps = state.steps ?? [];
  const stepActive = replay > 0 ? steps[replay - 1] : undefined;
  const visible = stepActive ? state.nodes.filter((n) => stepActive.visibleNodeIds?.includes(n.id)) : state.nodes;

  /** click a doc span → board view + pulse + scroll the node card */
  const focusNode = (id: string) => {
    setView("board");
    setReplay(0);
    setPulse((p) => ({ id, n: p.n + 1 }));
    requestAnimationFrame(() => {
      stageRef.current?.querySelector(`[data-node="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const Mk = ({ id, tone, children }: { id: string; tone: MarkTone; children: ReactNode }) => (
    <span
      className={`mk mk-${tone}`}
      title={t("pinned to the agent's understanding — click to inspect", "钉在 agent 的理解上——点击查看")}
      onClick={() => focusNode(id)}
    >
      {children}
    </span>
  );

  const actions: InterventionAction[] = [
    { label: t("Approve & distribute", "批准并分发"), variant: "primary", onAct: () => toast({ title: t("Minutes distributed", "纪要已分发"), body: t("Sent to 6 attendees · audit trail attached", "已发送给 6 位与会者 · 附审计链"), tone: "grounded" }) },
    { label: t("Confirm Zhang Wei", "确认张唯身份"), onAct: () => toast({ title: t("Identity confirmed", "身份已确认"), body: t("“Wei” → Zhang Wei (CFO office) · hypothesis promoted", "“Wei”→ 张唯（CFO 办公室）· 假设已提升"), tone: "grounded" }) },
    { label: t("Challenge an item", "对某条提出异议"), onAct: () => toast({ title: t("Challenge noted", "异议已记录"), body: t("Pick the span in the minutes to dispute it", "在纪要中点选要质疑的句子"), tone: "inflection" }) },
  ];

  const actionCols: Column<ActionRow>[] = [
    { key: "id", header: "#", mono: true, width: 36, render: (r) => r.id },
    { key: "item", header: t("action item", "行动项"), render: (r) => (zh ? r.itemZh : r.item) },
    {
      key: "owner",
      header: "owner",
      width: 130,
      render: (r) =>
        r.flag === "unowned" ? (
          <span className="own own-o" onClick={() => focusNode("n:acts")}>{t("unowned", "无人认领")}</span>
        ) : r.flag === "hypo" ? (
          <span className="own own-h" onClick={() => focusNode("n:who")}>{r.owner}</span>
        ) : (
          r.owner
        ),
    },
    { key: "due", header: "due", mono: true, width: 70, render: (r) => r.due },
  ];

  return (
    <div className="app-frame app-minutes">
      {/* ---- top chrome ---- */}
      <div className="app-topbar">
        <div className="brand">
          <span className="mk-brand">潛 Minutes</span>
          {t("Q3 Roadmap Review", "Q3 路线图评审")}
        </div>
        <div className="tcrumb">2026-06-10 · 10:00–10:52 · {t("6 attendees · recorded", "6 位与会者 · 有录音")}</div>
        <div className="tright">
          <span className="status-pill">{t("Ready · 2 confirmations pending", "就绪 · 2 项待确认")}</span>
          <Button size="sm" variant="primary" onClick={actions[0]!.onAct}>{t("Approve", "批准")}</Button>
        </div>
      </div>

      {/* ---- · Context — meetings (recessive) ---- */}
      <div className="zone zone-context">
        <div className="zone-head">· {t("Meetings", "会议")}</div>
        <div className="app-tree-row dir">{t("▾ this week", "▾ 本周")}</div>
        <div className="app-tree-row active">{t("  Q3 Roadmap Review", "  Q3 路线图评审")}</div>
        <div className="app-tree-row">{t("  Pipeline sync", "  管线同步会")}</div>
        <div className="app-tree-row">{t("  Design crit", "  设计评审")}</div>
        <div className="app-tree-row dir">{t("▾ last week", "▾ 上周")}</div>
        <div className="app-tree-row">{t("  Board prep", "  董事会预备会")}</div>
        <div className="app-tree-row">{t("  Q2 retro", "  Q2 复盘")}</div>
      </div>

      {/* ---- ② Artifact — THE MINUTES DOCUMENT (epistemics inline) ---- */}
      <div className="zone zone-artifact">
        <div className="zone-head">
          ② Artifact · {t("Minutes", "纪要")} <span className="zn">{t("every highlight is pinned to the agent's understanding — click one", "每处高亮都钉在 agent 的理解上——点一下试试")}</span>
        </div>
        <div className="doc">
          <div className="doc-title">{t("Minutes — Q3 Roadmap Review", "会议纪要 — Q3 路线图评审")}</div>
          <div className="doc-meta">2026-06-10 · 10:00–10:52 · {t("recorded & diarized", "已录音并分轨")}</div>

          {/* people strip */}
          <div className="people">
            {ATTENDEES.map((p) => (
              <span className="person" key={p.name}>
                <Avatar name={p.name} size="sm" />
                <span className="pname">{p.name}</span>
                <span className="prole">{zh ? p.roleZh : p.role}</span>
              </span>
            ))}
            <span className="person hypo" onClick={() => focusNode("n:who")}>
              <Avatar name={MENTIONED.name} size="sm" tone="hypothesis" />
              <span className="pname">{MENTIONED.name}</span>
              <span className="prole">{zh ? MENTIONED.roleZh : MENTIONED.role} · {zh ? MENTIONED.noteZh : MENTIONED.note}</span>
            </span>
          </div>

          {/* legend */}
          <div className="legend">
            <span><StateDot state="grounded" size="sm" /> {t("anchored", "已锚定")}</span>
            <span><StateDot state="hypothesis" size="sm" /> {t("held with uncertainty", "不确定持有")}</span>
            <span><StateDot state="open" size="sm" /> {t("needs you", "需要你定")}</span>
            <span><StateDot state="inflection" size="sm" /> {t("corrected", "已更正")}</span>
            <span><StateDot state="refuted" size="sm" /> {t("as spoken, retracted", "口述原文，已撤回")}</span>
          </div>

          <div className="doc-h">{t("1 · Decisions", "1 · 决策")}</div>
          <p>
            <Mk id="n:dec1" tone="g">{t("The Insights module ships Sept 12; v1 scope is frozen", "Insights 模块 9 月 12 日上线；v1 范围冻结")}</Mk>
            {t(" — committed by Sarah at 41:32, confirmed on record by all three leads.", "——Sarah 于 41:32 拍板，三位负责人均在录音中确认。")}
          </p>
          <p>
            {t("Positioning ties to the corrected market size: ", "定位口径与更正后的市场规模挂钩：")}
            <Mk id="n:tam-old" tone="r">{t("TAM $4.2B (as spoken, 18:24)", "TAM $4.2B（会上口述，18:24）")}</Mk>{" "}
            <Mk id="n:tam-fix" tone="i">{t("→ $3.1B per analyst deck v7 (May)", "→ 依分析师报告 v7（5 月）为 $3.1B")}</Mk>
            {t(" — the minutes carry the corrected figure.", "——纪要采用更正后的数字。")}
          </p>

          <div className="doc-h">{t("2 · Data points", "2 · 数据要点")}</div>
          <p>
            <Mk id="n:metric" tone="g">{t("Q2 retention is 94.2%", "Q2 留存率为 94.2%")}</Mk>
            {t(" — verified against the warehouse just now (re-runnable query, not a meeting memory).", "——刚对数据仓库核实过（查询可重跑，不是凭会议记忆）。")}
          </p>

          <div className="doc-h" onClick={() => focusNode("n:acts")} style={{ cursor: "pointer" }}>
            {t("3 · Action items", "3 · 行动项")} <span className="doc-h-sub">{t("6 extracted · 1 unowned", "提取 6 条 · 1 条无人认领")}</span>
          </div>
          <Table columns={actionCols} rows={ACTIONS} rowKey={(r) => r.id} dense />
          <p className="doc-foot">
            {t("Item #3 is ", "第 3 条")}
            <Mk id="n:budget" tone="o">{t("gated by a budget sign-off that was referenced but never confirmed in-meeting", "卡在一笔会上提及但从未确认的预算审批上")}</Mk>
            {t("; its owner hinges on ", "；其 owner 取决于")}
            <Mk id="n:who" tone="h">{t("whether “Wei” is Zhang Wei of the CFO office (0.62)", "“Wei”是否为 CFO 办公室的张唯（0.62）")}</Mk>
            {t(".", "。")}
          </p>
        </div>
      </div>

      {/* ---- · Activity — processing stream (peripheral) ---- */}
      <div className="zone zone-activity">
        <div className="zone-head">· Activity · {t("processing (peripheral · auditable)", "处理流（外围 · 可审计）")}</div>
        {state.toolCalls.map((c) => (
          <div className="app-row" key={c.id}>
            <span className="dot"></span>
            <Mono style={{ color: "var(--ink-500)", width: 44, flex: "none" }}>{c.ts}</Mono>
            {c.fn} · {c.summary}
          </div>
        ))}
      </div>

      {/* ---- ① Stage — the agent's understanding (lit primary) ---- */}
      <div className="zone zone-stage" ref={stageRef}>
        <div className="zone-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span>① Stage · {t("the agent's understanding", "agent 的理解")}</span>
          <Segmented
            value={view}
            onChange={(v) => { setView(v); setReplay(0); }}
            options={[
              { value: "plain", label: t("Plain", "简明") },
              { value: "board", label: t("Board", "详细") },
            ]}
          />
        </div>

        {view === "plain" ? (
          <>
            <PlainView state={state} actions={actions} />
          </>
        ) : (
          <>
            {replay === 0 && state.outcome && <OutcomeBanner outcome={state.outcome} />}
            {replay > 0 && (
              <div className="replay-bar">
                <Mono style={{ fontSize: 10.5, color: "var(--hypo)" }}>
                  {t("Replay", "回放")} {replay}/{steps.length} · {stepActive?.label}
                </Mono>
                <span className="replay-hint">{stepActive?.hint}</span>
              </div>
            )}
            <div className="board" key={replay}>
              {orderNodes(visible).map((n) => (
                <div key={n.id} data-node={n.id} className={pulse.id === n.id ? `pulse-${pulse.n % 2}` : undefined}>
                  <CognitiveNodeView node={n} />
                </div>
              ))}
            </div>
            <div className="step-ctl" style={{ borderTop: "1px solid var(--line)" }}>
              {replay === 0 ? (
                <button onClick={() => setReplay(1)}>{t("▸ Replay: watch this understanding form", "▸ 回放：看这份理解如何形成")}</button>
              ) : (
                <>
                  <button onClick={() => setReplay((r) => Math.max(1, r - 1))} disabled={replay === 1}>{t("◂ Prev", "◂ 上一步")}</button>
                  <button onClick={() => setReplay((r) => Math.min(steps.length, r + 1))} disabled={replay === steps.length}>{t("Next ▸", "下一步 ▸")}</button>
                  <button onClick={() => setReplay(0)}>{t("↺ Full result", "↺ 完整结果")}</button>
                </>
              )}
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="rsub">{t("③ What you can do", "③ 你可以做什么")}</div>
              <InterventionRail actions={actions} column={false} />
            </div>
          </>
        )}
      </div>
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
