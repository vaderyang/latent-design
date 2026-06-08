/** Low-level pieces shared by the cognitive-node cards. All schema-typed. */
import { useState } from "react";
import type { Confidence, Evidence, Provenance } from "@latent/schema";

type Tone = "g" | "h" | "o" | "r";

const SRC_LABEL: Record<Confidence["source"], string> = {
  logprob: "logprob",
  self_consistency: "self-consist",
  self_report: "self-report",
  human: "human",
};

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <div className={`badge ${tone}`}>{children}</div>;
}

/** Confidence meter — a calibrated value with its source (never a vibe number). */
export function ConfidenceMeter({
  confidence,
  tone = "h",
  label = "confidence",
  showSource = true,
}: {
  confidence: Confidence;
  tone?: "g" | "h";
  label?: string;
  showSource?: boolean;
}) {
  const pct = Math.round(confidence.value * 100);
  return (
    <div className="conf">
      <span className="lab">{label}</span>
      <div className="track">
        <div className={`fill ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="val">{confidence.value.toFixed(2)}</span>
      {showSource && <span className="src" title="confidence source">{SRC_LABEL[confidence.source]}</span>}
    </div>
  );
}

/** Evidence chips — each pins to ≥1 observable primitive. Supports vs refutes. */
export function EvidenceChips({
  evidence,
  onSelect,
}: {
  evidence: Evidence[];
  onSelect?: (e: Evidence) => void;
}) {
  if (!evidence.length) return null;
  return (
    <div className="evid-row">
      {evidence.map((e) => (
        <div
          key={e.id}
          className={`echip${e.polarity === "refutes" ? " refutes" : ""}`}
          onClick={() => onSelect?.(e)}
          title={e.primitives.join(" · ")}
        >
          <span className="ic">{e.polarity === "refutes" ? "◇" : "◆"}</span> {e.label}
        </div>
      ))}
    </div>
  );
}

/** The "what would change it" block — falsification, needs, or refutation reason. */
export function Falsification({
  text,
  label = "什么会改变它",
  tone = "o",
}: {
  text: string;
  label?: string;
  tone?: "o" | "h" | "r";
}) {
  const style =
    tone === "r"
      ? { background: "var(--refuted-dim)", borderColor: "var(--line)" }
      : undefined;
  const bStyle = tone === "r" ? { color: "var(--refuted)" } : tone === "o" ? { color: "var(--open)" } : undefined;
  return (
    <div className="falsify" style={style}>
      <b style={bStyle}>{label}</b>
      {text}
    </div>
  );
}

/** Provenance — weakened ≠ hidden. Always openable; surfaces verifiable vs asserted. */
export function ProvenanceView({
  provenance,
  label = "provenance · observable primitives",
  defaultOpen = false,
}: {
  provenance: Provenance;
  label?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const n = provenance.steps.length;
  return (
    <>
      <div className="prov-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? "▾" : "▸"} {label} · {n} {n === 1 ? "step" : "steps"}
      </div>
      <div className={`prov${open ? " open" : ""}`}>
        <span className={`pmode ${provenance.mode}`}>
          {provenance.mode === "verifiable" ? "◆ verifiable · 可重执行验证" : "○ asserted · 仅自报"}
        </span>
        {provenance.steps.map((st, i) => (
          <div className="pline" key={i}>
            <span className="src">{st.toolCallId}</span>
            <span>{st.observed}</span>
          </div>
        ))}
        {provenance.mode === "verifiable" && provenance.reExecCmd && (
          <div className="reexec">
            <b>re-exec ▸ </b>
            {provenance.reExecCmd}
          </div>
        )}
      </div>
    </>
  );
}
