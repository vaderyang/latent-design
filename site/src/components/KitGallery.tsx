/** KitGallery — a live, Storybook-style showcase of @latent/react/kit.
 *  Every component is rendered with the real library. Fully bilingual: labels
 *  and sample content switch with the language toggle (useLang), alongside the
 *  kit's own auto-switching vocabulary. */
import { useState } from "react";
import type { ReactNode } from "react";
import {
  Button,
  IconButton,
  Badge,
  Tag,
  Chip,
  Card,
  Panel,
  Meter,
  Disclosure,
  Segmented,
  Tabs,
  Switch,
  Field,
  Input,
  Textarea,
  Callout,
  Divider,
  Kbd,
  Tooltip,
  StateDot,
  CertaintyPill,
  ConfidenceMeter,
  EvidenceList,
  Provenance,
  FalsifyNote,
  InflectionMark,
  EpistemicCard,
  OutcomeBanner,
  Reveal,
  Voice,
  Mono,
  ZoneLayout,
  Zone,
  ThemeToggle,
  LangToggle,
  Checkbox,
  RadioGroup,
  Select,
  Slider,
  Modal,
  Drawer,
  Popover,
  Toaster,
  useToast,
  Table,
  DescList,
  Stat,
  Avatar,
  AvatarGroup,
  Skeleton,
  Spinner,
  EmptyState,
  Timeline,
  Breadcrumb,
  Pagination,
  Steps,
  NavList,
  NavGroup,
  NavItem,
  Toolbar,
  ToolbarSpacer,
  useLang,
} from "@latent/react/kit";
import type { Tone, Column } from "@latent/react/kit";

const TONES: Tone[] = ["grounded", "hypothesis", "open", "inflection", "refuted", "neutral"];

function Demo({ label, children, wide }: { label: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`kit-demo${wide ? " kit-demo--wide" : ""}`}>
      <div className="kit-demo__lbl">{label}</div>
      <div className="kit-demo__body">{children}</div>
    </div>
  );
}

function ToastDemo() {
  const toast = useToast();
  const zh = useLang() === "zh";
  const t = (en: string, zhs: string) => (zh ? zhs : en);
  return (
    <div className="kit-flex">
      <Button
        onClick={() =>
          toast({
            title: t("Hypothesis promoted", "假设已提升"),
            body: t("conf 0.34 → 0.89 · cyan turns gold", "conf 0.34 → 0.89 · 青转金"),
            tone: "grounded",
          })
        }
      >
        {t("grounded toast", "grounded 通知")}
      </Button>
      <Button
        onClick={() =>
          toast({
            title: t("Changed my mind", "我改了主意"),
            body: t("retransmission re-judged as a symptom", "重传被重判为症状"),
            tone: "inflection",
          })
        }
      >
        {t("inflection toast", "inflection 通知")}
      </Button>
    </div>
  );
}

interface LeadRow {
  id: string;
  claim: string;
  claimZh: string;
  conf: number;
  state: Tone;
}
const LEAD_ROWS: LeadRow[] = [
  { id: "h1", claim: "GC pause on instance-7", claimZh: "instance-7 的 GC 停顿", conf: 0.89, state: "grounded" },
  { id: "h2", claim: "connection-pool queueing", claimZh: "连接池排队", conf: 0.71, state: "hypothesis" },
  { id: "h3", claim: "DNS resolution jitter", claimZh: "DNS 解析抖动", conf: 0.08, state: "refuted" },
];

function GalleryInner() {
  const zh = useLang() === "zh";
  const t = (en: string, zhs: string) => (zh ? zhs : en);

  const [chips, setChips] = useState<Set<string>>(new Set(["dns"]));
  const [seg, setSeg] = useState("plain");
  const [on, setOn] = useState(true);
  const [disc, setDisc] = useState(false);
  const [revealKey, setRevealKey] = useState(0);
  const [agree, setAgree] = useState(true);
  const [radio, setRadio] = useState("managed");
  const [sel, setSel] = useState("cloud-run");
  const [slider, setSlider] = useState(72);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [page, setPage] = useState(3);
  const [navAt, setNavAt] = useState("understanding");

  const toggleChip = (k: string) =>
    setChips((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  const leadColumns: Column<LeadRow>[] = [
    { key: "id", header: "id", mono: true, width: 60 },
    { key: "claim", header: t("claim", "论断"), render: (r) => (zh ? r.claimZh : r.claim) },
    {
      key: "state",
      header: t("state", "状态"),
      render: (r) => (
        <span className="kit-flex" style={{ alignItems: "center", gap: 6 }}>
          <StateDot state={r.state} size="sm" /> <Mono style={{ fontSize: 11 }}>{r.state}</Mono>
        </span>
      ),
    },
    { key: "conf", header: "conf", mono: true, align: "right", render: (r) => r.conf.toFixed(2) },
  ];

  return (
    <div className="kit-gallery">
      {/* primitives ------------------------------------------------------- */}
      <Panel title={t("Primitives · Buttons", "原语 · 按钮")} className="kit-panel">
        <div className="kit-grid">
          <Demo label={t("variants", "变体")}>
            <div className="kit-flex">
              <Button variant="primary">{t("Primary", "主操作")}</Button>
              <Button>{t("Default", "默认")}</Button>
              <Button variant="ghost">{t("Ghost", "幽灵")}</Button>
            </div>
          </Demo>
          <Demo label={t("sizes", "尺寸")}>
            <div className="kit-flex" style={{ alignItems: "center" }}>
              <Button size="sm">{t("Small", "小")}</Button>
              <Button>{t("Medium", "中")}</Button>
              <Button size="lg">{t("Large", "大")}</Button>
            </div>
          </Demo>
          <Demo label={t("tone accent + icon + disabled", "语气强调 + 图标 + 禁用")}>
            <div className="kit-flex" style={{ alignItems: "center" }}>
              <Button tone="grounded">{t("Accept", "采纳")}</Button>
              <Button tone="open">{t("Push back", "提出异议")}</Button>
              <IconButton aria-label="more">⋯</IconButton>
              <Button disabled>{t("Disabled", "禁用")}</Button>
            </div>
          </Demo>
        </div>
      </Panel>

      <Panel title={t("Primitives · Badges, Tags, Chips", "原语 · 徽标 / 标签 / 筹片")} className="kit-panel">
        <div className="kit-grid">
          <Demo label={t("Badge (epistemic tones)", "Badge（认识论语气）")}>
            <div className="kit-flex">
              {TONES.map((tn) => (
                <Badge key={tn} tone={tn}>
                  {tn}
                </Badge>
              ))}
            </div>
          </Demo>
          <Demo label="Tag">
            <div className="kit-flex">
              <Tag>{t("label", "标签")}</Tag>
              <Tag mono>op:src:tco</Tag>
              <Tag mono>v0.2</Tag>
            </div>
          </Demo>
          <Demo label={t("Chip (selectable · removable)", "Chip（可选中 · 可移除）")}>
            <div className="kit-flex">
              <Chip pressed={chips.has("dns")} onToggle={() => toggleChip("dns")}>
                {t("DNS jitter", "DNS 抖动")}
              </Chip>
              <Chip pressed={chips.has("retrans")} onToggle={() => toggleChip("retrans")}>
                {t("TCP retransmit", "TCP 重传")}
              </Chip>
              <Chip tone="grounded" onRemove={() => {}}>
                {t("GC pause", "GC 停顿")}
              </Chip>
            </div>
          </Demo>
        </div>
      </Panel>

      <Panel title={t("Primitives · Surfaces & inputs", "原语 · 容器与输入")} className="kit-panel">
        <div className="kit-grid">
          <Demo label={t("Card (toned)", "Card（带语气）")}>
            <Card tone="hypothesis">
              <Voice as="div" style={{ fontSize: 16 }}>
                {t("A hypothesis held with uncertainty.", "一个以不确定性持有的假设。")}
              </Voice>
            </Card>
          </Demo>
          <Demo label={t("Meter / gradient", "Meter / 渐变")}>
            <div style={{ width: 240 }}>
              <Meter value={0.4} tone="open" label="open" />
              <Meter value={0.89} gradient label="conf" caption="self-consist" />
            </div>
          </Demo>
          <Demo label="Disclosure">
            <Disclosure
              open={disc}
              onOpenChange={setDisc}
              summary={t("how I confirmed this", "我是怎么确认的")}
              openSummary={t("collapse", "收起")}
            >
              <Card inset padSm>
                <Mono>· DNS resp &lt;2ms · 0 retransmits</Mono>
              </Card>
            </Disclosure>
          </Demo>
          <Demo label="Segmented">
            <Segmented
              value={seg}
              onChange={setSeg}
              options={[
                { value: "plain", label: t("Plain", "简明") },
                { value: "detail", label: t("Detail", "详细") },
                { value: "dev", label: t("Dev", "开发者") },
              ]}
            />
          </Demo>
          <Demo label="Switch">
            <Switch checked={on} onChange={setOn} label={on ? t("Operator view", "Operator 视图") : t("Trace view", "Trace 视图")} />
          </Demo>
          <Demo label="Field / Input / Textarea">
            <div style={{ width: 260, display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label={t("goal", "目标")} hint={t("what you want to accomplish", "你想达成什么")}>
                <Input placeholder={t("e.g. decide whether to adopt K8s", "例如：决定要不要上 K8s")} />
              </Field>
              <Field label={t("constraint", "约束")} error={t("required", "必填")}>
                <Textarea placeholder={t("add a real constraint…", "补充一条真实约束…")} />
              </Field>
            </div>
          </Demo>
          <Demo label={t("Callout (tones)", "Callout（语气）")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 320 }}>
              <Callout tone="grounded" title="grounded">
                {t("Anchored to evidence.", "锚定在证据上。")}
              </Callout>
              <Callout tone="open" title={t("open question", "未决问题")}>
                {t("An honest unknown, kept visible.", "诚实的未知，保持可见。")}
              </Callout>
            </div>
          </Demo>
          <Demo label="Divider · Kbd · Tooltip">
            <div style={{ width: 300 }}>
              <Divider label="provenance" />
              <div className="kit-flex" style={{ alignItems: "center" }}>
                <span>
                  {t("Press", "按下")} <Kbd>⌘</Kbd> <Kbd>K</Kbd>
                </span>
                <Tooltip label={t("weakened ≠ hidden", "弱化 ≠ 隐藏")}>
                  <Button size="sm" variant="ghost">
                    {t("hover me", "悬停看看")}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </Demo>
          <Demo label="Tabs" wide>
            <Tabs
              items={[
                {
                  value: "a",
                  label: t("Understanding", "理解态"),
                  content: <Card flat>{t("The lit primary plane.", "被点亮的主舞台。")}</Card>,
                },
                {
                  value: "b",
                  label: t("Activity", "动作流"),
                  content: <Card flat>{t("The peripheral, auditable rail.", "外围的、可审计的轨道。")}</Card>,
                },
                {
                  value: "c",
                  label: t("Intervene", "干预"),
                  content: <Card flat>{t("Human controls, first-class.", "人类控制，一等公民。")}</Card>,
                },
              ]}
            />
          </Demo>
        </div>
      </Panel>

      {/* forms ------------------------------------------------------------ */}
      <Panel title={t("Forms · Checkbox, Radio, Select, Slider", "表单 · 勾选 / 单选 / 下拉 / 滑杆")} className="kit-panel">
        <div className="kit-grid">
          <Demo label="Checkbox">
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <Checkbox label={t("surface inflections", "浮现拐点")} checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <Checkbox label={t("hide provenance (never)", "隐藏 provenance（永不）")} disabled />
            </div>
          </Demo>
          <Demo label="RadioGroup">
            <RadioGroup
              name="deploy"
              value={radio}
              onChange={setRadio}
              options={[
                { value: "managed", label: t("Managed containers + IaC", "托管容器 + IaC") },
                { value: "k8s", label: t("Self-hosted K8s", "自建 K8s") },
              ]}
            />
          </Demo>
          <Demo label="Select">
            <div style={{ width: 240 }}>
              <Select
                value={sel}
                onChange={(e) => setSel(e.target.value)}
                options={[
                  { value: "cloud-run", label: "Cloud Run" },
                  { value: "ecs", label: "ECS" },
                  { value: "k8s", label: "Kubernetes" },
                ]}
              />
            </div>
          </Demo>
          <Demo label="Slider">
            <div style={{ width: 240, display: "flex", alignItems: "center", gap: 12 }}>
              <Slider value={slider} onChange={setSlider} />
              <Mono style={{ fontSize: 11, minWidth: 30, textAlign: "right" }}>{slider}</Mono>
            </div>
          </Demo>
        </div>
      </Panel>

      {/* overlays ---------------------------------------------------------- */}
      <Panel title={t("Overlays · Modal, Drawer, Popover, Toast", "浮层 · 弹窗 / 抽屉 / 气泡 / 通知")} className="kit-panel">
        <div className="kit-grid">
          <Demo label="Modal">
            <Button onClick={() => setModal(true)}>{t("open modal", "打开弹窗")}</Button>
            <Modal
              open={modal}
              onClose={() => setModal(false)}
              title={t("Pause for your call", "暂停，等你拍板")}
              footer={
                <>
                  <Button variant="ghost" onClick={() => setModal(false)}>
                    {t("Not now", "稍后")}
                  </Button>
                  <Button variant="primary" onClick={() => setModal(false)}>
                    {t("Approve", "批准")}
                  </Button>
                </>
              }
            >
              {t(
                "Two high-stakes drafts await approval. The agent does not decide these for you — human intervention is a first-class feature, not an edge case.",
                "两封高风险草稿等待批准。agent 不会替你决定这些——人类干预是一等特性，不是边缘情况。",
              )}
            </Modal>
          </Demo>
          <Demo label="Drawer">
            <Button onClick={() => setDrawer(true)}>{t("open drawer", "打开抽屉")}</Button>
            <Drawer open={drawer} onClose={() => setDrawer(false)} title="Provenance">
              <Timeline
                items={[
                  { title: "pcap_slice", meta: "12:04:31 · 2.1M pkt", tone: "hypothesis" },
                  { title: "align_timestamps", meta: "PCAP ⟷ safepoint.log", tone: "hypothesis" },
                  { title: t("root cause settled", "根因凝定"), meta: "conf 0.89", tone: "grounded" },
                ]}
              />
            </Drawer>
          </Demo>
          <Demo label="Popover">
            <Popover trigger={<Button variant="ghost">{t("what would change it ▾", "什么会改变它 ▾")}</Button>}>
              <div style={{ fontSize: 12.5, color: "var(--ink-300)", lineHeight: 1.6, maxWidth: 240 }}>
                {t(
                  "If the retransmission spike led the latency spike, this gets promoted back to a cause.",
                  "若重传尖峰在时间上领先延迟尖峰，它会被重新升级为病因。",
                )}
              </div>
            </Popover>
          </Demo>
          <Demo label={t("Toast (auto-dismiss · click to close)", "Toast（自动消失 · 点击关闭）")}>
            <ToastDemo />
          </Demo>
        </div>
      </Panel>

      {/* semantic --------------------------------------------------------- */}
      <Panel title={t("Semantic · Epistemic vocabulary", "语义 · 认识论词汇")} className="kit-panel">
        <div className="kit-grid">
          <Demo label="StateDot">
            <div className="kit-flex" style={{ alignItems: "center" }}>
              {TONES.map((tn) => (
                <span key={tn} className="kit-flex" style={{ alignItems: "center", gap: 6 }}>
                  <StateDot state={tn} ring />
                  <Mono style={{ fontSize: 11 }}>{tn}</Mono>
                </span>
              ))}
            </div>
          </Demo>
          <Demo label={t("CertaintyPill (word-level, never a number)", "CertaintyPill（词级确定度，不给数字）")}>
            <div className="kit-flex">
              <CertaintyPill level="firm">{t("fairly sure", "比较确定")}</CertaintyPill>
              <CertaintyPill level="lean">{t("leaning yes", "倾向认为")}</CertaintyPill>
              <CertaintyPill level="open">{t("still weighing", "还在判断")}</CertaintyPill>
              <CertaintyPill level="out">{t("ruled out", "已排除")}</CertaintyPill>
            </div>
          </Demo>
          <Demo label="ConfidenceMeter">
            <div style={{ width: 280 }}>
              <ConfidenceMeter value={0.89} source="self-consist" />
            </div>
          </Demo>
          <Demo label={t("EvidenceList (supports / refutes)", "EvidenceList（支持 / 反驳）")}>
            <EvidenceList
              items={[
                { label: t("no dedicated SRE", "无专职 SRE"), polarity: "supports" },
                { label: t("flat traffic, 3 services", "流量平稳、3 服务"), polarity: "supports" },
                { label: t("“big companies use K8s”", "“大厂都用 K8s”"), polarity: "refutes" },
              ]}
            />
          </Demo>
          <Demo label={t("Provenance (verifiable)", "Provenance（可重执行）")} wide>
            <Provenance
              defaultOpen
              mode="verifiable"
              steps={[
                { ref: "tc:pcap", observed: "DNS resp <2ms · 0 retransmits" },
                { ref: "tc:gc", observed: t("STW 280ms × 7 on instance-7", "instance-7 上 STW 280ms × 7") },
              ]}
              reExecCmd="latent replay tc:gc --window 12:04:00..12:05:00"
            />
          </Demo>
          <Demo label="FalsifyNote">
            <FalsifyNote
              text={t(
                "If a platform/SRE team already exists, the recommendation flips — K8s starts to pay off.",
                "若已有平台/SRE 团队，建议反转——K8s 开始划算。",
              )}
            />
          </Demo>
          <Demo label="InflectionMark">
            <InflectionMark
              kind="refutation"
              from={t("retransmission is the cause", "重传是病因")}
              to={t("retransmission is a symptom", "重传是症状")}
              rationale={t(
                "It lags the latency spike, so attention turns to the application layer.",
                "它滞后于延迟尖峰，注意力转向应用层。",
              )}
            />
          </Demo>
          <Demo label={t("EpistemicCard — grounded", "EpistemicCard — grounded")} wide>
            <EpistemicCard
              state="grounded"
              title={t(
                "Root cause: long GC pauses on instance-7 backing up the connection pool",
                "根因：instance-7 的 GC 长停顿，引发连接池排队",
              )}
              badge={<Badge tone="grounded">{t("answer", "回答")}</Badge>}
              confidence={{ value: 0.89, source: "self-consist" }}
              evidence={[
                { label: "STW 280ms × 7", polarity: "supports" },
                { label: t("pool backlog 12→53", "连接池积压 12→53"), polarity: "supports" },
              ]}
              provenance={{
                mode: "verifiable",
                steps: [{ ref: "tc:gc", observed: t("safepoint log: 7 long pauses", "safepoint 日志：7 次长停顿") }],
                reExecCmd: "latent replay tc:gc",
              }}
            />
          </Demo>
          <Demo label="EpistemicCard — open" wide>
            <EpistemicCard
              state="open"
              title={t(
                "Is there a hard compliance requirement forcing private deployment?",
                "是否有强制私有化部署的硬合规要求？",
              )}
              falsification={t(
                "Confirm data-residency / private-deploy constraints — they change the managed-vs-self-hosted call.",
                "确认数据驻留 / 私有部署约束——它会改变托管 vs 自建的结论。",
              )}
            />
          </Demo>
          <Demo label="OutcomeBanner" wide>
            <OutcomeBanner
              label={t("Recommendation · Grounded", "建议 · Grounded")}
              text={t(
                "Use managed containers + IaC for now; save K8s for when scale or team reach its payoff zone.",
                "先用托管容器 + IaC；把 K8s 留到规模或团队触及其收益区再上。",
              )}
              recommendation={t("First confirm the compliance constraint.", "先确认合规约束。")}
            />
          </Demo>
        </div>
      </Panel>

      {/* data display ------------------------------------------------------ */}
      <Panel title={t("Data display · Table, Stat, Timeline …", "数据展示 · 表格 / 指标 / 时间线 …")} className="kit-panel">
        <div className="kit-grid">
          <Demo label={t("Table (epistemic rows)", "Table（认识论行）")} wide>
            <Table columns={leadColumns} rows={LEAD_ROWS} rowKey={(r) => r.id} />
          </Demo>
          <Demo label="Stat">
            <div className="kit-flex" style={{ gap: 28 }}>
              <Stat label={t("P99 latency", "P99 延迟")} value="340ms" delta="▲ 12ms → 340ms" tone="inflection" />
              <Stat label={t("root-cause conf", "根因置信")} value="0.89" delta={t("▲ settled", "▲ 已凝定")} tone="grounded" />
            </div>
          </Demo>
          <Demo label="DescList">
            <DescList
              items={[
                { term: t("task", "任务"), desc: t("core-pay P99 spike", "core-pay P99 尖峰") },
                { term: t("status", "状态"), desc: t("diagnosed · verifiable", "已诊断 · 可重执行") },
                { term: "re-exec", desc: <Mono style={{ fontSize: 11 }}>latent replay tc:gc</Mono> },
              ]}
            />
          </Demo>
          <Demo label="Timeline">
            <Timeline
              items={[
                { title: t("Two leads surfaced", "两条线索浮现"), meta: "12:04", tone: "hypothesis" },
                { title: t("DNS ruled out", "DNS 被排除"), meta: t("12:06 · resp <2ms", "12:06 · 响应 <2ms"), tone: "refuted" },
                { title: t("Changed my mind", "我改了主意"), meta: t("12:07 · symptom, not cause", "12:07 · 是症状非病因"), tone: "inflection" },
                { title: t("Root cause settled", "根因凝定"), meta: "12:09 · conf 0.89", tone: "grounded" },
              ]}
            />
          </Demo>
          <Demo label="Avatar / AvatarGroup">
            <div className="kit-flex" style={{ alignItems: "center" }}>
              <Avatar name="Payments SRE" tone="hypothesis" />
              <Avatar name="Vader Yang" size="lg" />
              <AvatarGroup names={["Ada L", "Grace H", "Alan T"]} size="sm" />
            </div>
          </Demo>
          <Demo label="Skeleton · Spinner">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 220 }}>
              <Skeleton width="70%" />
              <Skeleton width="100%" />
              <Skeleton width="45%" height={22} />
              <div className="kit-flex" style={{ alignItems: "center", marginTop: 4 }}>
                <Spinner /> <Spinner size="sm" />
                <Mono style={{ fontSize: 11, color: "var(--ink-500)" }}>{t("forming…", "正在形成…")}</Mono>
              </div>
            </div>
          </Demo>
          <Demo label="EmptyState" wide>
            <EmptyState
              title={t("No open questions", "没有未决问题")}
              hint={t(
                "Every claim on this surface is grounded or has a falsification condition. That's the goal state — not a blank page.",
                "这个面上的每条论断要么 grounded、要么带可证伪条件。这是目标状态——不是空白页。",
              )}
              action={<Button size="sm">{t("Add a constraint", "补充约束")}</Button>}
            />
          </Demo>
        </div>
      </Panel>

      {/* navigation -------------------------------------------------------- */}
      <Panel
        title={t("Navigation · Toolbar, NavList, Breadcrumb, Pagination, Steps", "导航 · 工具栏 / 导航列 / 面包屑 / 分页 / 步骤")}
        className="kit-panel"
      >
        <div className="kit-grid">
          <Demo label="Toolbar" wide>
            <Toolbar title="潛 IDE">
              <Tag mono>reimburse-app</Tag>
              <ToolbarSpacer />
              <Breadcrumb items={[{ label: "apps", href: "#" }, { label: "demos", href: "#" }, { label: "kit" }]} />
              <ToolbarSpacer />
              <Button size="sm" variant="ghost">
                ⌘K
              </Button>
            </Toolbar>
          </Demo>
          <Demo label={t("NavList (Context zone)", "NavList（Context 区）")}>
            <div style={{ width: 210 }}>
              <NavList>
                <NavGroup>{t("workspace", "工作区")}</NavGroup>
                <NavItem active={navAt === "understanding"} onClick={() => setNavAt("understanding")} icon="◉">
                  {t("Understanding", "理解态")}
                </NavItem>
                <NavItem active={navAt === "activity"} onClick={() => setNavAt("activity")} icon="·" badge={<Badge tone="neutral">12</Badge>}>
                  {t("Activity", "动作流")}
                </NavItem>
                <NavItem active={navAt === "artifacts"} onClick={() => setNavAt("artifacts")} icon="▤">
                  {t("Artifacts", "工件")}
                </NavItem>
              </NavList>
            </div>
          </Demo>
          <Demo label={t("Steps (epistemic: done=grounded · current=in play)", "Steps（认识论：完成=grounded · 当前=在押）")} wide>
            <Steps
              current={2}
              steps={[
                { label: t("Surface leads", "浮现线索"), hint: "hypotheses" },
                { label: t("Rule out", "排除"), hint: t("refuted sinks", "refuted 沉降") },
                { label: t("Settle", "凝定"), hint: "conf 0.89" },
                { label: t("Verify", "复核"), hint: "re-exec" },
              ]}
            />
          </Demo>
          <Demo label="Pagination">
            <Pagination page={page} count={12} onChange={setPage} />
          </Demo>
        </div>
      </Panel>

      {/* motion ----------------------------------------------------------- */}
      <Panel
        title={t("Motion · narrates state transitions", "动效 · 讲述状态迁移")}
        actions={
          <Button size="sm" variant="ghost" onClick={() => setRevealKey((k) => k + 1)}>
            {t("↻ replay", "↻ 重放")}
          </Button>
        }
        className="kit-panel"
      >
        <div className="kit-grid" key={revealKey}>
          <Demo label="surface">
            <Reveal motion="surface">
              <Card tone="hypothesis">{t("A new lead rises from the depths.", "新线索从深处浮现。")}</Card>
            </Reveal>
          </Demo>
          <Demo label="settle">
            <Reveal motion="settle">
              <Card tone="grounded">{t("Confidence resolves; cyan turns gold.", "置信凝定；青转金。")}</Card>
            </Reveal>
          </Demo>
          <Demo label="sink">
            <Reveal motion="sink">
              <Card tone="refuted">{t("A refuted lead recedes — kept, not deleted.", "被推翻的线索退下——保留，不删除。")}</Card>
            </Reveal>
          </Demo>
          <Demo label="pulse">
            <Reveal motion="pulse">
              <Card tone="inflection">{t("A change-of-mind cue.", "一次改主意的提示。")}</Card>
            </Reveal>
          </Demo>
        </div>
      </Panel>

      {/* layout ----------------------------------------------------------- */}
      <Panel title={t("Layout · App Attention Grammar", "布局 · App 注意力语法")} className="kit-panel">
        <ZoneLayout areas={'"ctx stage" "act stage"'} columns="150px 1fr" rows="1fr auto" style={{ minHeight: 260 }}>
          <Zone role="context" head="· Context">
            <div>routes/approvals.ts</div>
            <div>db/schema.ts</div>
            <div>rbac.ts</div>
          </Zone>
          <Zone role="stage" head={t("① Stage · Understanding", "① Stage · 理解态")}>
            <EpistemicCard
              state="grounded"
              title={t(
                "Requirement: 3 roles + attachments + state transitions",
                "需求理解：三角色 + 附件 + 状态流转",
              )}
              badge={<Badge tone="grounded">{t("requirement", "需求")}</Badge>}
            />
          </Zone>
          <Zone role="activity" head="· Activity">
            <div>scaffold · {t("7 files", "7 个文件")}</div>
            <div>smoke_test · /health 200</div>
          </Zone>
        </ZoneLayout>
      </Panel>

      {/* controls --------------------------------------------------------- */}
      <Panel title={t("Controls · drop-in toggles", "控制件 · 即插即用开关")} className="kit-panel">
        <div className="kit-grid">
          <Demo label="ThemeToggle">
            <ThemeToggle />
          </Demo>
          <Demo label={t("LangToggle (flip it — everything above re-renders)", "LangToggle（切一下——上面全部重渲染）")}>
            <LangToggle />
          </Demo>
        </div>
      </Panel>
    </div>
  );
}

export default function KitGallery() {
  return (
    <Toaster>
      <GalleryInner />
    </Toaster>
  );
}
