/** Peripheral & control components: Activity Stream, Trace view, Intervention, Persona toggle. */
import { useState } from "react";
import type { ToolCall, Persona } from "@latent/schema";

/** The recessive, auditable stream of tool calls. Weakened, never hidden. */
export function ActivityStream({
  toolCalls,
  collapsedByDefault = true,
  maxWhenOpen = 6,
}: {
  toolCalls: ToolCall[];
  collapsedByDefault?: boolean;
  maxWhenOpen?: number;
}) {
  const [open, setOpen] = useState(!collapsedByDefault);
  const shown = toolCalls.slice(0, maxWhenOpen);
  const rest = toolCalls.length - shown.length;
  return (
    <div className="activity-stream">
      <div className="as-head" onClick={() => setOpen((o) => !o)}>
        <span className="l">{open ? "▾" : "▸"} Activity Stream</span>
        <span className="r">
          {toolCalls.length} calls · {open ? "展开 · 点击收起" : "收起中 · 点击展开"}
        </span>
      </div>
      <div className={`as-body${open ? " open" : ""}`}>
        {shown.map((c) => (
          <div className="as-line" key={c.id}>
            <span className="tt">{c.ts}</span>
            <span className="fn">{c.fn}</span> {c.summary}
          </div>
        ))}
        {rest > 0 && <div className="as-line" style={{ color: "var(--ink-600)" }}>… {rest} more</div>}
      </div>
    </div>
  );
}

/** A compact mini-list of tool calls for the scenario rail. */
export function ActivityMini({ toolCalls }: { toolCalls: ToolCall[] }) {
  return (
    <>
      {toolCalls.map((c) => (
        <div className="act-mini" key={c.id}>
          {c.fn}
        </div>
      ))}
    </>
  );
}

/** Builder / audit persona — here tool calls ARE the subject. */
export function TraceView({
  toolCalls,
  note,
}: {
  toolCalls: ToolCall[];
  note?: string;
}) {
  return (
    <div className="trace-panel">
      <div className="tlabel">Trace View · builder / 审计人格 — 此处 tool-call 才是主体</div>
      {toolCalls.map((c) => (
        <div className="trace-line" key={c.id}>
          <span className="tt">{c.ts}</span>
          <span className="fn">
            {c.fn}()
          </span>
          <span className="dur">{c.durationMs != null ? `${(c.durationMs / 1000).toFixed(1)}s` : "—"}{c.summary ? ` · ${c.summary}` : ""}</span>
        </div>
      ))}
      {note && (
        <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--ink-400)" }}>{note}</p>
      )}
    </div>
  );
}

export interface InterventionAction {
  label: string;
  variant?: "primary" | "default";
  onAct?: () => void;
}

/** Human intervention is a first-class feature, not an edge case. */
export function InterventionRail({ actions, column = true }: { actions: InterventionAction[]; column?: boolean }) {
  return (
    <div className="interv" style={column ? { flexDirection: "column" } : undefined}>
      {actions.map((a, i) => (
        <button key={i} className={`ibtn${a.variant === "primary" ? " primary" : ""}`} onClick={a.onAct}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

/** Operator (latent-led, default) vs Trace (tool-call-led). One toggle, not either/or. */
export function PersonaToggle({ persona, onChange }: { persona: Persona; onChange: (p: Persona) => void }) {
  return (
    <div className="modes">
      <button className={`mode-btn${persona === "operator" ? " active" : ""}`} onClick={() => onChange("operator")}>
        Operator
      </button>
      <button className={`mode-btn${persona === "trace" ? " active" : ""}`} onClick={() => onChange("trace")}>
        Trace
      </button>
    </div>
  );
}
