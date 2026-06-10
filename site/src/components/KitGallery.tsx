/** KitGallery — a live, Storybook-style showcase of @latent/react/kit.
 *  Every component is rendered with the real library; flip the theme/language
 *  toggles (top-right, or the in-page ones) to see tokens + auto-switching
 *  vocabulary respond. */
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
} from "@latent/react/kit";
import type { Tone, Column } from "@latent/react/kit";

const TONES: Tone[] = ["grounded", "hypothesis", "open", "inflection", "refuted", "neutral"];

function Demo({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`kit-demo${wide ? " kit-demo--wide" : ""}`}>
      <div className="kit-demo__lbl">{label}</div>
      <div className="kit-demo__body">{children}</div>
    </div>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="kit-flex">
      <Button onClick={() => toast({ title: "Hypothesis promoted", body: "conf 0.34 → 0.89 · cyan turns gold", tone: "grounded" })}>
        grounded toast
      </Button>
      <Button onClick={() => toast({ title: "Changed my mind", body: "retransmission re-judged as a symptom", tone: "inflection" })}>
        inflection toast
      </Button>
    </div>
  );
}

interface LeadRow {
  id: string;
  claim: string;
  conf: number;
  state: Tone;
}
const LEAD_ROWS: LeadRow[] = [
  { id: "h1", claim: "GC pause on instance-7", conf: 0.89, state: "grounded" },
  { id: "h2", claim: "connection-pool queueing", conf: 0.71, state: "hypothesis" },
  { id: "h3", claim: "DNS resolution jitter", conf: 0.08, state: "refuted" },
];
const LEAD_COLUMNS: Column<LeadRow>[] = [
  { key: "id", header: "id", mono: true, width: 60 },
  { key: "claim", header: "claim" },
  {
    key: "state",
    header: "state",
    render: (r) => (
      <span className="kit-flex" style={{ alignItems: "center", gap: 6 }}>
        <StateDot state={r.state} size="sm" /> <Mono style={{ fontSize: 11 }}>{r.state}</Mono>
      </span>
    ),
  },
  { key: "conf", header: "conf", mono: true, align: "right", render: (r) => r.conf.toFixed(2) },
];

function GalleryInner() {
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

  return (
    <div className="kit-gallery">
      {/* primitives ------------------------------------------------------- */}
      <Panel title="Primitives · Buttons" className="kit-panel">
        <div className="kit-grid">
          <Demo label="variants">
            <div className="kit-flex">
              <Button variant="primary">Primary</Button>
              <Button>Default</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </Demo>
          <Demo label="sizes">
            <div className="kit-flex" style={{ alignItems: "center" }}>
              <Button size="sm">Small</Button>
              <Button>Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </Demo>
          <Demo label="tone accent + icon + disabled">
            <div className="kit-flex" style={{ alignItems: "center" }}>
              <Button tone="grounded">Accept</Button>
              <Button tone="open">Push back</Button>
              <IconButton aria-label="more">⋯</IconButton>
              <Button disabled>Disabled</Button>
            </div>
          </Demo>
        </div>
      </Panel>

      <Panel title="Primitives · Badges, Tags, Chips" className="kit-panel">
        <div className="kit-grid">
          <Demo label="Badge (epistemic tones)">
            <div className="kit-flex">
              {TONES.map((t) => (
                <Badge key={t} tone={t}>
                  {t}
                </Badge>
              ))}
            </div>
          </Demo>
          <Demo label="Tag">
            <div className="kit-flex">
              <Tag>label</Tag>
              <Tag mono>op:src:tco</Tag>
              <Tag mono>v0.2</Tag>
            </div>
          </Demo>
          <Demo label="Chip (selectable · removable)">
            <div className="kit-flex">
              <Chip pressed={chips.has("dns")} onToggle={() => toggleChip("dns")}>
                DNS jitter
              </Chip>
              <Chip pressed={chips.has("retrans")} onToggle={() => toggleChip("retrans")}>
                TCP retransmit
              </Chip>
              <Chip tone="grounded" onRemove={() => {}}>
                GC pause
              </Chip>
            </div>
          </Demo>
        </div>
      </Panel>

      <Panel title="Primitives · Surfaces & inputs" className="kit-panel">
        <div className="kit-grid">
          <Demo label="Card (toned)">
            <Card tone="hypothesis">
              <Voice as="div" style={{ fontSize: 16 }}>
                A hypothesis held with uncertainty.
              </Voice>
            </Card>
          </Demo>
          <Demo label="Meter / gradient">
            <div style={{ width: 240 }}>
              <Meter value={0.4} tone="open" label="open" />
              <Meter value={0.89} gradient label="conf" caption="self-consist" />
            </div>
          </Demo>
          <Demo label="Disclosure">
            <Disclosure
              open={disc}
              onOpenChange={setDisc}
              summary="how I confirmed this"
              openSummary="collapse"
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
                { value: "plain", label: "Plain" },
                { value: "detail", label: "Detail" },
                { value: "dev", label: "Dev" },
              ]}
            />
          </Demo>
          <Demo label="Switch">
            <Switch checked={on} onChange={setOn} label={on ? "Operator view" : "Trace view"} />
          </Demo>
          <Demo label="Field / Input / Textarea">
            <div style={{ width: 260, display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="goal" hint="what you want to accomplish">
                <Input placeholder="e.g. decide whether to adopt K8s" />
              </Field>
              <Field label="constraint" error="required">
                <Textarea placeholder="add a real constraint…" />
              </Field>
            </div>
          </Demo>
          <Demo label="Callout (tones)">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 320 }}>
              <Callout tone="grounded" title="grounded">
                Anchored to evidence.
              </Callout>
              <Callout tone="open" title="open question">
                An honest unknown, kept visible.
              </Callout>
            </div>
          </Demo>
          <Demo label="Divider · Kbd · Tooltip">
            <div style={{ width: 300 }}>
              <Divider label="provenance" />
              <div className="kit-flex" style={{ alignItems: "center" }}>
                <span>
                  Press <Kbd>⌘</Kbd> <Kbd>K</Kbd>
                </span>
                <Tooltip label="weakened ≠ hidden">
                  <Button size="sm" variant="ghost">
                    hover me
                  </Button>
                </Tooltip>
              </div>
            </div>
          </Demo>
          <Demo label="Tabs" wide>
            <Tabs
              items={[
                { value: "a", label: "Understanding", content: <Card flat>The lit primary plane.</Card> },
                { value: "b", label: "Activity", content: <Card flat>The peripheral, auditable rail.</Card> },
                { value: "c", label: "Intervene", content: <Card flat>Human controls, first-class.</Card> },
              ]}
            />
          </Demo>
        </div>
      </Panel>

      {/* forms ------------------------------------------------------------ */}
      <Panel title="Forms · Checkbox, Radio, Select, Slider" className="kit-panel">
        <div className="kit-grid">
          <Demo label="Checkbox">
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <Checkbox label="surface inflections" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <Checkbox label="hide provenance (never)" disabled />
            </div>
          </Demo>
          <Demo label="RadioGroup">
            <RadioGroup
              name="deploy"
              value={radio}
              onChange={setRadio}
              options={[
                { value: "managed", label: "Managed containers + IaC" },
                { value: "k8s", label: "Self-hosted K8s" },
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
      <Panel title="Overlays · Modal, Drawer, Popover, Toast" className="kit-panel">
        <div className="kit-grid">
          <Demo label="Modal">
            <Button onClick={() => setModal(true)}>open modal</Button>
            <Modal
              open={modal}
              onClose={() => setModal(false)}
              title="Pause for your call"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setModal(false)}>
                    Not now
                  </Button>
                  <Button variant="primary" onClick={() => setModal(false)}>
                    Approve
                  </Button>
                </>
              }
            >
              Two high-stakes drafts await approval. The agent does not decide these for you — human intervention is a
              first-class feature, not an edge case.
            </Modal>
          </Demo>
          <Demo label="Drawer">
            <Button onClick={() => setDrawer(true)}>open drawer</Button>
            <Drawer open={drawer} onClose={() => setDrawer(false)} title="Provenance">
              <Timeline
                items={[
                  { title: "pcap_slice", meta: "12:04:31 · 2.1M pkt", tone: "hypothesis" },
                  { title: "align_timestamps", meta: "PCAP ⟷ safepoint.log", tone: "hypothesis" },
                  { title: "root cause settled", meta: "conf 0.89", tone: "grounded" },
                ]}
              />
            </Drawer>
          </Demo>
          <Demo label="Popover">
            <Popover trigger={<Button variant="ghost">what would change it ▾</Button>}>
              <div style={{ fontSize: 12.5, color: "var(--ink-300)", lineHeight: 1.6, maxWidth: 240 }}>
                If the retransmission spike <em>led</em> the latency spike, this gets promoted back to a cause.
              </div>
            </Popover>
          </Demo>
          <Demo label="Toast (auto-dismiss · click to close)">
            <ToastDemo />
          </Demo>
        </div>
      </Panel>

      {/* semantic --------------------------------------------------------- */}
      <Panel title="Semantic · Epistemic vocabulary" className="kit-panel">
        <div className="kit-grid">
          <Demo label="StateDot">
            <div className="kit-flex" style={{ alignItems: "center" }}>
              {TONES.map((t) => (
                <span key={t} className="kit-flex" style={{ alignItems: "center", gap: 6 }}>
                  <StateDot state={t} ring />
                  <Mono style={{ fontSize: 11 }}>{t}</Mono>
                </span>
              ))}
            </div>
          </Demo>
          <Demo label="CertaintyPill (word-level, never a number)">
            <div className="kit-flex">
              <CertaintyPill level="firm">fairly sure</CertaintyPill>
              <CertaintyPill level="lean">leaning yes</CertaintyPill>
              <CertaintyPill level="open">still weighing</CertaintyPill>
              <CertaintyPill level="out">ruled out</CertaintyPill>
            </div>
          </Demo>
          <Demo label="ConfidenceMeter">
            <div style={{ width: 280 }}>
              <ConfidenceMeter value={0.89} source="self-consist" />
            </div>
          </Demo>
          <Demo label="EvidenceList (supports / refutes)">
            <EvidenceList
              items={[
                { label: "no dedicated SRE", polarity: "supports" },
                { label: "flat traffic, 3 services", polarity: "supports" },
                { label: "“big companies use K8s”", polarity: "refutes" },
              ]}
            />
          </Demo>
          <Demo label="Provenance (verifiable)" wide>
            <Provenance
              defaultOpen
              mode="verifiable"
              steps={[
                { ref: "tc:pcap", observed: "DNS resp <2ms · 0 retransmits" },
                { ref: "tc:gc", observed: "STW 280ms × 7 on instance-7" },
              ]}
              reExecCmd="latent replay tc:gc --window 12:04:00..12:05:00"
            />
          </Demo>
          <Demo label="FalsifyNote">
            <FalsifyNote text="If a platform/SRE team already exists, the recommendation flips — K8s starts to pay off." />
          </Demo>
          <Demo label="InflectionMark">
            <InflectionMark
              kind="refutation"
              from="retransmission is the cause"
              to="retransmission is a symptom"
              rationale="It lags the latency spike, so attention turns to the application layer."
            />
          </Demo>
          <Demo label="EpistemicCard — grounded" wide>
            <EpistemicCard
              state="grounded"
              title="Root cause: long GC pauses on instance-7 backing up the connection pool"
              badge={<Badge tone="grounded">answer</Badge>}
              confidence={{ value: 0.89, source: "self-consist" }}
              evidence={[
                { label: "STW 280ms × 7", polarity: "supports" },
                { label: "pool backlog 12→53", polarity: "supports" },
              ]}
              provenance={{
                mode: "verifiable",
                steps: [{ ref: "tc:gc", observed: "safepoint log: 7 long pauses" }],
                reExecCmd: "latent replay tc:gc",
              }}
            />
          </Demo>
          <Demo label="EpistemicCard — open" wide>
            <EpistemicCard
              state="open"
              title="Is there a hard compliance requirement forcing private deployment?"
              falsification="Confirm data-residency / private-deploy constraints — they change the managed-vs-self-hosted call."
            />
          </Demo>
          <Demo label="OutcomeBanner" wide>
            <OutcomeBanner
              label="Recommendation · Grounded"
              text="Use managed containers + IaC for now; save K8s for when scale or team reach its payoff zone."
              recommendation="First confirm the compliance constraint."
            />
          </Demo>
        </div>
      </Panel>

      {/* data display ------------------------------------------------------ */}
      <Panel title="Data display · Table, Stat, Timeline …" className="kit-panel">
        <div className="kit-grid">
          <Demo label="Table (epistemic rows)" wide>
            <Table columns={LEAD_COLUMNS} rows={LEAD_ROWS} rowKey={(r) => r.id} />
          </Demo>
          <Demo label="Stat">
            <div className="kit-flex" style={{ gap: 28 }}>
              <Stat label="P99 latency" value="340ms" delta="▲ 12ms → 340ms" tone="inflection" />
              <Stat label="root-cause conf" value="0.89" delta="▲ settled" tone="grounded" />
            </div>
          </Demo>
          <Demo label="DescList">
            <DescList
              items={[
                { term: "task", desc: "core-pay P99 spike" },
                { term: "status", desc: "diagnosed · verifiable" },
                { term: "re-exec", desc: <Mono style={{ fontSize: 11 }}>latent replay tc:gc</Mono> },
              ]}
            />
          </Demo>
          <Demo label="Timeline">
            <Timeline
              items={[
                { title: "Two leads surfaced", meta: "12:04", tone: "hypothesis" },
                { title: "DNS ruled out", meta: "12:06 · resp <2ms", tone: "refuted" },
                { title: "Changed my mind", meta: "12:07 · symptom, not cause", tone: "inflection" },
                { title: "Root cause settled", meta: "12:09 · conf 0.89", tone: "grounded" },
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
                <Mono style={{ fontSize: 11, color: "var(--ink-500)" }}>forming…</Mono>
              </div>
            </div>
          </Demo>
          <Demo label="EmptyState" wide>
            <EmptyState
              title="No open questions"
              hint="Every claim on this surface is grounded or has a falsification condition. That's the goal state — not a blank page."
              action={<Button size="sm">Add a constraint</Button>}
            />
          </Demo>
        </div>
      </Panel>

      {/* navigation -------------------------------------------------------- */}
      <Panel title="Navigation · Toolbar, NavList, Breadcrumb, Pagination, Steps" className="kit-panel">
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
          <Demo label="NavList (Context zone)">
            <div style={{ width: 210 }}>
              <NavList>
                <NavGroup>workspace</NavGroup>
                <NavItem active={navAt === "understanding"} onClick={() => setNavAt("understanding")} icon="◉">
                  Understanding
                </NavItem>
                <NavItem active={navAt === "activity"} onClick={() => setNavAt("activity")} icon="·" badge={<Badge tone="neutral">12</Badge>}>
                  Activity
                </NavItem>
                <NavItem active={navAt === "artifacts"} onClick={() => setNavAt("artifacts")} icon="▤">
                  Artifacts
                </NavItem>
              </NavList>
            </div>
          </Demo>
          <Demo label="Steps (epistemic: done=grounded · current=in play)" wide>
            <Steps
              current={2}
              steps={[
                { label: "Surface leads", hint: "hypotheses" },
                { label: "Rule out", hint: "refuted sinks" },
                { label: "Settle", hint: "conf 0.89" },
                { label: "Verify", hint: "re-exec" },
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
        title="Motion · narrates state transitions"
        actions={
          <Button size="sm" variant="ghost" onClick={() => setRevealKey((k) => k + 1)}>
            ↻ replay
          </Button>
        }
        className="kit-panel"
      >
        <div className="kit-grid" key={revealKey}>
          <Demo label="surface">
            <Reveal motion="surface">
              <Card tone="hypothesis">A new lead rises from the depths.</Card>
            </Reveal>
          </Demo>
          <Demo label="settle">
            <Reveal motion="settle">
              <Card tone="grounded">Confidence resolves; cyan turns gold.</Card>
            </Reveal>
          </Demo>
          <Demo label="sink">
            <Reveal motion="sink">
              <Card tone="refuted">A refuted lead recedes — kept, not deleted.</Card>
            </Reveal>
          </Demo>
          <Demo label="pulse">
            <Reveal motion="pulse">
              <Card tone="inflection">A change-of-mind cue.</Card>
            </Reveal>
          </Demo>
        </div>
      </Panel>

      {/* layout ----------------------------------------------------------- */}
      <Panel title="Layout · App Attention Grammar" className="kit-panel">
        <ZoneLayout
          areas={'"ctx stage" "act stage"'}
          columns="150px 1fr"
          rows="1fr auto"
          style={{ minHeight: 260 }}
        >
          <Zone role="context" head="· Context">
            <div>routes/approvals.ts</div>
            <div>db/schema.ts</div>
            <div>rbac.ts</div>
          </Zone>
          <Zone role="stage" head="① Stage · Understanding">
            <EpistemicCard
              state="grounded"
              title="Requirement: 3 roles + attachments + state transitions"
              badge={<Badge tone="grounded">requirement</Badge>}
            />
          </Zone>
          <Zone role="activity" head="· Activity">
            <div>scaffold · 7 files</div>
            <div>smoke_test · /health 200</div>
          </Zone>
        </ZoneLayout>
      </Panel>

      {/* controls --------------------------------------------------------- */}
      <Panel title="Controls · drop-in toggles" className="kit-panel">
        <div className="kit-grid">
          <Demo label="ThemeToggle">
            <ThemeToggle />
          </Demo>
          <Demo label="LangToggle (flip it — semantic vocabulary above re-renders)">
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
