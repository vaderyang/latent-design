/** Latent kit — the distinctive design-language components, decoupled from the
 *  CognitiveState schema. Fixed design vocabulary (verifiable/asserted, the
 *  "what would change it" label, inflection words) auto-switches language via
 *  the shared i18n dictionary; everything else is plain props. */
import type { ReactNode } from "react";
import { cx, toneClass } from "./types.ts";
import type { Tone } from "./types.ts";
import { Badge, Callout, Disclosure, Meter } from "./primitives.tsx";
import { useStrings } from "../i18n.ts";

/** Epistemic states (a subset of Tone that has dedicated semantics). */
export type EpistemicState = "grounded" | "hypothesis" | "open" | "inflection" | "refuted";

/* ---------- StateDot ---------- */
export function StateDot({
  state,
  ring,
  size = "md",
  className,
}: {
  state: Tone;
  ring?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "lk-dot",
        toneClass(state),
        ring && "lk-dot--ring",
        size === "sm" && "lk-dot--sm",
        size === "lg" && "lk-dot--lg",
        className,
      )}
    />
  );
}

/* ---------- CertaintyPill — a soft word-level pill, never a number ---------- */
export type CertaintyLevel = "firm" | "lean" | "open" | "out";
const CERT_TONE: Record<CertaintyLevel, Tone> = {
  firm: "grounded",
  lean: "hypothesis",
  open: "open",
  out: "refuted",
};
export function CertaintyPill({ level = "lean", children, className }: { level?: CertaintyLevel; children: ReactNode; className?: string }) {
  return (
    <span className={cx("lk-cert", toneClass(CERT_TONE[level]), className)}>
      <span className="lk-cert__dot" />
      {children}
    </span>
  );
}

/* ---------- ConfidenceMeter — calibrated value + source ---------- */
export function ConfidenceMeter({
  value,
  source,
  label = "confidence",
  className,
}: {
  value: number;
  source?: ReactNode;
  label?: string;
  className?: string;
}) {
  return <Meter value={value} gradient label={label} caption={source} className={className} />;
}

/* ---------- EvidenceList ---------- */
export interface EvidenceItem {
  id?: string;
  label: ReactNode;
  polarity?: "supports" | "refutes";
  /** native title tooltip, e.g. the observable primitives it pins to */
  title?: string;
}
export function EvidenceList({ items, onSelect, className }: { items: EvidenceItem[]; onSelect?: (e: EvidenceItem) => void; className?: string }) {
  if (!items.length) return null;
  return (
    <div className={cx("lk-evid", className)}>
      {items.map((e, i) => (
        <span
          key={e.id ?? i}
          className={cx("lk-evid__chip", e.polarity === "refutes" && "lk-evid__chip--refutes")}
          title={e.title}
          onClick={onSelect ? () => onSelect(e) : undefined}
          style={onSelect ? { cursor: "pointer" } : undefined}
        >
          <span className="lk-evid__ic">{e.polarity === "refutes" ? "◇" : "◆"}</span>
          {e.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- Provenance (foldable; weakened ≠ hidden) ---------- */
export interface ProvenanceStep {
  /** the source ref, e.g. a tool-call id */
  ref?: ReactNode;
  observed: ReactNode;
}
export interface ProvenanceProps {
  mode?: "verifiable" | "asserted";
  steps: ProvenanceStep[];
  reExecCmd?: string;
  label?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}
export function Provenance({ mode = "asserted", steps, reExecCmd, label, defaultOpen = false, className }: ProvenanceProps) {
  const t = useStrings();
  const lab = label ?? t.prim.provenanceLabel;
  const n = steps.length;
  return (
    <Disclosure className={className} defaultOpen={defaultOpen} summary={`${lab} · ${n} ${n === 1 ? "step" : "steps"}`}>
      <span className={cx("lk-prov__mode", mode === "verifiable" ? "lk-prov__mode--verifiable" : "lk-prov__mode--asserted")}>
        {mode === "verifiable" ? t.prim.verifiable : t.prim.asserted}
      </span>
      {steps.map((s, i) => (
        <div className="lk-prov__line" key={i}>
          {s.ref != null && <span className="lk-prov__src">{s.ref}</span>}
          <span>{s.observed}</span>
        </div>
      ))}
      {mode === "verifiable" && reExecCmd && (
        <div className="lk-prov__reexec">
          <b>re-exec ▸ </b>
          {reExecCmd}
        </div>
      )}
    </Disclosure>
  );
}

/* ---------- FalsifyNote — "what would change it" ---------- */
export function FalsifyNote({ text, label, tone = "open", className }: { text: ReactNode; label?: ReactNode; tone?: Tone; className?: string }) {
  const t = useStrings();
  return (
    <Callout tone={tone} title={label ?? t.prim.whatWouldChange} className={className}>
      {text}
    </Callout>
  );
}

/* ---------- InflectionMark — a change of mind, surfaced not buried ---------- */
export function InflectionMark({
  from,
  to,
  kind,
  rationale,
  className,
}: {
  from: ReactNode;
  to: ReactNode;
  kind?: "backtrack" | "aha" | "refutation";
  rationale?: ReactNode;
  className?: string;
}) {
  const t = useStrings();
  return (
    <div className={cx("lk-inflect", className)}>
      <div className="lk-inflect__it">
        {t.inflect.prefix}
        {kind ? t.inflect[kind] : ""}
      </div>
      <div className="lk-inflect__body">
        <span className="lk-inflect__from">{from}</span> → <span className="lk-inflect__to">{to}</span>
      </div>
      {rationale && <div className="lk-inflect__why">{rationale}</div>}
    </div>
  );
}

/* ---------- EpistemicCard — one claim, colour = epistemic state ---------- */
export interface EpistemicCardProps {
  state: EpistemicState;
  title: ReactNode;
  /** badge text; defaults to the epistemic-state word */
  badge?: ReactNode;
  confidence?: { value: number; source?: ReactNode };
  evidence?: EvidenceItem[];
  provenance?: ProvenanceProps;
  /** the "what would change it" / "what it needs" text */
  falsification?: ReactNode;
  className?: string;
  children?: ReactNode;
}
export function EpistemicCard({ state, title, badge, confidence, evidence, provenance, falsification, className, children }: EpistemicCardProps) {
  const t = useStrings();
  const refuted = state === "refuted";
  const stateWord =
    state === "grounded" || state === "hypothesis" || state === "open" || state === "refuted" ? t.state[state] : undefined;
  const badgeNode = badge ?? (stateWord ? <Badge tone={state}>{stateWord}</Badge> : null);
  const falsifyTone: Tone = state === "open" ? "open" : state === "refuted" ? "refuted" : "hypothesis";
  return (
    <div className={cx("lk-ecard", toneClass(state), refuted && "lk-ecard--refuted", className)}>
      <div className="lk-ecard__head">
        <div className="lk-ecard__title">{title}</div>
        {badgeNode}
      </div>
      {confidence && <ConfidenceMeter value={confidence.value} source={confidence.source} />}
      {evidence && evidence.length > 0 && <EvidenceList items={evidence} />}
      {falsification && <FalsifyNote text={falsification} tone={falsifyTone} />}
      {provenance && <Provenance {...provenance} />}
      {children}
    </div>
  );
}

/* ---------- OutcomeBanner — the settled result ---------- */
export function OutcomeBanner({
  label,
  text,
  recommendation,
  className,
}: {
  label?: ReactNode;
  text: ReactNode;
  recommendation?: ReactNode;
  className?: string;
}) {
  const t = useStrings();
  return (
    <div className={cx("lk-outcome", className)}>
      <div className="lk-outcome__l">◆ {label ?? t.panel.outcome}</div>
      <div className="lk-outcome__text">{text}</div>
      {recommendation && (
        <div className="lk-outcome__rec">
          {t.panel.suggestion}
          {recommendation}
        </div>
      )}
    </div>
  );
}
