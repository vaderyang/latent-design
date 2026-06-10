/** 潛 Minutes — an AI-native meeting-minutes app.
 *
 *  Hierarchy (corrected): the WORK PRODUCT — the minutes document — is the
 *  stage. The agent's understanding stands in the margin: a slim, quiet
 *  support rail of compact items (what needs you, what was corrected, what was
 *  verified), each expandable in place. The full epistemic reading lives one
 *  tap away in a drawer — weakened, never hidden.
 *
 *  The document still carries the epistemics inline (highlights pinned to
 *  cognitive nodes); clicking a highlight expands + pulses the matching rail
 *  item — a proportionate response, not a stage takeover. All mock data; the
 *  agent layer is driven by a validated CognitiveState (examples/minutes.json). */
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { CognitiveState } from "@latent/schema";
import { PlainView, useLang } from "@latent/react";
import type { InterventionAction } from "@latent/react";
import { Avatar, Table, Button, Drawer, Disclosure, Toaster, useToast, StateDot, Mono } from "@latent/react/kit";
import type { Column, Tone } from "@latent/react/kit";
import dataEn from "@examples/minutes.json";
import dataZh from "@examples/minutes.zh.json";

/* ---------------------------------------------------------- mock people */
interface Person {
  name: string;
  role: string;
  roleZh: string;
}
const ATTENDEES: Person[] = [
  { name: "Sarah Chen", role: "CEO", roleZh: "CEO" },
  { name: "Marcus Liu", role: "CPO", roleZh: "CPO" },
  { name: "Elena Petrova", role: "Eng Lead", roleZh: "研发负责人" },
  { name: "David Park", role: "Data Lead", roleZh: "数据负责人" },
  { name: "Tom Garcia", role: "Sales", roleZh: "销售" },
  { name: "You", role: "Chief of Staff", roleZh: "幕僚长" },
];

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

type MarkTone = "g" | "h" | "o" | "i" | "r";

/* a compact, quiet support-rail item — the agent in the margin */
function RailItem({
  tone,
  title,
  meta,
  children,
  open,
  onToggle,
  pulse,
  itemRef,
}: {
  tone: Tone;
  title: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  open: boolean;
  onToggle: () => void;
  pulse?: string;
  itemRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div className={`rail-item${open ? " open" : ""}${pulse ? ` ${pulse}` : ""}`} ref={itemRef}>
      <button type="button" className="rail-head" onClick={onToggle} aria-expanded={open}>
        <StateDot state={tone} size="sm" />
        <span className="rail-title">{title}</span>
        {meta && <span className="rail-meta">{meta}</span>}
        <span className="rail-chev">{open ? "▾" : "▸"}</span>
      </button>
      {open && children && <div className="rail-body">{children}</div>}
    </div>
  );
}

function App() {
  const zh = useLang() === "zh";
  const t = (en: string, zhs: string) => (zh ? zhs : en);
  const toast = useToast();

  const parsed = CognitiveState.safeParse(zh ? dataZh : dataEn);
  if (!parsed.success) return <div className="contract-error">✗ invalid CognitiveState</div>;
  const state = parsed.data;
  const node = (id: string) => state.nodes.find((n) => n.id === id);

  const [open, setOpen] = useState<string>("n:who"); // one rail item expanded
  const [pulse, setPulse] = useState<{ id: string; n: number }>({ id: "", n: 0 });
  const [drawer, setDrawer] = useState(false);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /** click a doc highlight → expand + pulse the matching rail item (proportionate) */
  const focusNode = (id: string) => {
    setOpen(id);
    setPulse((p) => ({ id, n: p.n + 1 }));
    requestAnimationFrame(() => itemRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };
  const toggle = (id: string) => setOpen((o) => (o === id ? "" : id));
  const pulseCls = (id: string) => (pulse.id === id ? `pulse-${pulse.n % 2}` : undefined);

  const Mk = ({ id, tone, children }: { id: string; tone: MarkTone; children: ReactNode }) => (
    <span className={`mk mk-${tone}`} title={t("the agent stands behind this — click for its note", "这句话背后有 agent 的注记——点击查看")} onClick={() => focusNode(id)}>
      {children}
    </span>
  );

  const approve = () =>
    toast({ title: t("Minutes distributed", "纪要已分发"), body: t("Sent to 6 attendees · audit trail attached", "已发送给 6 位与会者 · 附审计链"), tone: "grounded" });
  const confirmWei = () =>
    toast({ title: t("Identity confirmed", "身份已确认"), body: t("“Wei” → Zhang Wei (CFO office) · note resolved", "“Wei”→ 张唯（CFO 办公室）· 注记已消解"), tone: "grounded" });
  const askCfo = () =>
    toast({ title: t("Sent to CFO office", "已发送 CFO 办公室"), body: t("Asked to confirm the $120k Q3 budget", "请其确认 Q3 的 $120k 预算"), tone: "hypothesis" });
  const reexec = () =>
    toast({ title: t("Re-ran the check", "已重跑验证"), body: "kpi.q2_retention = 0.942 ✓", tone: "grounded" });

  const drawerActions: InterventionAction[] = [
    { label: t("Approve & distribute", "批准并分发"), variant: "primary", onAct: approve },
    { label: t("Confirm Zhang Wei", "确认张唯身份"), onAct: confirmWei },
    { label: t("Ask CFO office", "询问 CFO 办公室"), onAct: askCfo },
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

  const who = node("n:who");
  const budget = node("n:budget");
  const tamFix = node("n:tam-fix");
  const dec = node("n:dec1");
  const metric = node("n:metric");
  const acts = node("n:acts");

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
          <Button size="sm" variant="primary" onClick={approve}>{t("Approve", "批准")}</Button>
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

      {/* ---- ① THE MINUTES — the work product IS the stage ---- */}
      <div className="zone zone-doc">
        <div className="doc">
          <div className="doc-title">{t("Minutes — Q3 Roadmap Review", "会议纪要 — Q3 路线图评审")}</div>
          <div className="doc-meta">2026-06-10 · 10:00–10:52 · {t("recorded & diarized", "已录音并分轨")}</div>

          {/* attendees */}
          <div className="people">
            {ATTENDEES.map((p) => (
              <span className="person" key={p.name}>
                <Avatar name={p.name} size="sm" />
                <span className="pname">{p.name}</span>
                <span className="prole">{zh ? p.roleZh : p.role}</span>
              </span>
            ))}
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
          <Table columns={actionCols} rows={ACTIONS} rowKey={(r) => r.id} />
          <p className="doc-foot">
            {t("Item #3 is ", "第 3 条")}
            <Mk id="n:budget" tone="o">{t("gated by a budget sign-off that was referenced but never confirmed in-meeting", "卡在一笔会上提及但从未确认的预算审批上")}</Mk>
            {t("; its owner hinges on ", "；其 owner 取决于")}
            <Mk id="n:who" tone="h">{t("whether “Wei” is Zhang Wei of the CFO office", "“Wei”是否为 CFO 办公室的张唯")}</Mk>
            {t(".", "。")}
          </p>

          <div className="legend">
            <span><StateDot state="grounded" size="sm" /> {t("anchored", "已锚定")}</span>
            <span><StateDot state="hypothesis" size="sm" /> {t("held with uncertainty", "不确定持有")}</span>
            <span><StateDot state="open" size="sm" /> {t("needs you", "需要你定")}</span>
            <span><StateDot state="inflection" size="sm" /> {t("corrected", "已更正")}</span>
            <span><StateDot state="refuted" size="sm" /> {t("as spoken, retracted", "口述原文，已撤回")}</span>
          </div>
        </div>
      </div>

      {/* ---- · Agent — the supporting margin (slim, quiet, expandable) ---- */}
      <div className="zone zone-agent">
        <div className="zone-head">· {t("Agent · in support", "Agent · 支持")}</div>
        <div className="rail-sum">
          {t("3 decisions · 6 actions · figures checked, 1 corrected", "3 项决策 · 6 条行动 · 数字核查完毕，1 处更正")}
        </div>

        <div className="rail-group">{t("Needs you", "需要你定")} · 2</div>
        {who && who.state === "hypothesis" && (
          <RailItem
            tone="hypothesis"
            title={t("Is “Wei” Zhang Wei (CFO office)?", "“Wei”是张唯（CFO 办公室）吗？")}
            meta="0.62"
            open={open === "n:who"}
            onToggle={() => toggle("n:who")}
            pulse={pulseCls("n:who")}
            itemRef={(el) => (itemRefs.current["n:who"] = el)}
          >
            <div className="rail-why">{who.falsification}</div>
            <div className="rail-acts">
              <Button size="sm" onClick={confirmWei}>{t("It's Zhang Wei", "是张唯")}</Button>
              <Button size="sm" variant="ghost" onClick={() => toast({ title: t("Flipped", "已反转"), body: t("Owner reassigned to Wei Lin (Design)", "owner 改为林薇（设计部）"), tone: "inflection" })}>
                {t("It's Wei Lin", "是林薇")}
              </Button>
            </div>
          </RailItem>
        )}
        {budget && budget.state === "open" && (
          <RailItem
            tone="open"
            title={t("Budget sign-off unconfirmed", "预算审批未确认")}
            open={open === "n:budget"}
            onToggle={() => toggle("n:budget")}
            pulse={pulseCls("n:budget")}
            itemRef={(el) => (itemRefs.current["n:budget"] = el)}
          >
            <div className="rail-why">{budget.needs}</div>
            <div className="rail-acts">
              <Button size="sm" onClick={askCfo}>{t("Ask CFO office", "询问 CFO 办公室")}</Button>
            </div>
          </RailItem>
        )}

        <div className="rail-group">{t("Corrected", "已更正")} · 1</div>
        {tamFix && tamFix.state === "inflection" && (
          <RailItem
            tone="inflection"
            title={t("TAM $4.2B → $3.1B", "TAM $4.2B → $3.1B")}
            open={open === "n:tam-fix" || open === "n:tam-old"}
            onToggle={() => toggle("n:tam-fix")}
            pulse={pulseCls("n:tam-fix") ?? pulseCls("n:tam-old")}
            itemRef={(el) => { itemRefs.current["n:tam-fix"] = el; itemRefs.current["n:tam-old"] = el; }}
          >
            <div className="rail-why">{tamFix.rationale}</div>
            <div className="rail-fine">{t("The spoken figure is kept, sunk, for audit.", "口述原文已沉降保留，可供审计。")}</div>
          </RailItem>
        )}

        <div className="rail-group">{t("Standing behind", "已核实")} · 3</div>
        {dec && dec.state === "grounded" && (
          <RailItem
            tone="grounded"
            title={t("Ship decision — on record", "上线决策——有录音在案")}
            open={open === "n:dec1"}
            onToggle={() => toggle("n:dec1")}
            pulse={pulseCls("n:dec1")}
            itemRef={(el) => (itemRefs.current["n:dec1"] = el)}
          >
            {dec.evidence.map((e) => (
              <div className="rail-ev" key={e.id}>◆ {e.label}</div>
            ))}
          </RailItem>
        )}
        {metric && metric.state === "grounded" && (
          <RailItem
            tone="grounded"
            title={t("Retention 94.2% — re-runnable", "留存 94.2%——可重跑")}
            open={open === "n:metric"}
            onToggle={() => toggle("n:metric")}
            pulse={pulseCls("n:metric")}
            itemRef={(el) => (itemRefs.current["n:metric"] = el)}
          >
            <div className="rail-cmd">{metric.provenance.reExecCmd}</div>
            <div className="rail-acts">
              <Button size="sm" onClick={reexec}>{t("Re-run check", "重跑验证")}</Button>
            </div>
          </RailItem>
        )}
        {acts && acts.state === "grounded" && (
          <RailItem
            tone="grounded"
            title={t("6 actions extracted · #4 unowned", "提取 6 条行动 · #4 无人认领")}
            open={open === "n:acts"}
            onToggle={() => toggle("n:acts")}
            pulse={pulseCls("n:acts")}
            itemRef={(el) => (itemRefs.current["n:acts"] = el)}
          >
            <div className="rail-why">{acts.provenance.steps[0]?.observed}</div>
          </RailItem>
        )}

        <div className="rail-foot">
          <button type="button" className="rail-full" onClick={() => setDrawer(true)}>
            {t("Full understanding ▸", "完整理解 ▸")}
          </button>
          <Disclosure summary={t("6 tool calls · 1:36", "6 次工具调用 · 1:36")} openSummary={t("collapse", "收起")}>
            {state.toolCalls.map((c) => (
              <div className="rail-tc" key={c.id}>
                <Mono style={{ color: "var(--ink-600)", width: 40, flex: "none" }}>{c.ts}</Mono>
                <span>{c.fn} · {c.summary}</span>
              </div>
            ))}
          </Disclosure>
        </div>
      </div>

      {/* ---- the full epistemic reading — one tap away, never gone ---- */}
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
