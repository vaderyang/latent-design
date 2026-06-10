/** Latent kit — data display: Table, DescList, Stat, Avatar, Skeleton, Spinner,
 *  EmptyState, Timeline, Breadcrumb, Pagination, Steps.
 *  Numbers and identifiers read in mono (instrument output); titles in the UI
 *  voice; the big Stat value speaks in serif (a deliberated quantity). */
import type { CSSProperties, ReactNode } from "react";
import { cx, toneClass } from "./types.ts";
import type { Tone } from "./types.ts";
import { StateDot } from "./semantic.tsx";

/* ---------- Table ---------- */
export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  /** render the cell in mono (identifiers, metrics) */
  mono?: boolean;
  width?: string | number;
  render?: (row: T, index: number) => ReactNode;
}
export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  dense,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  dense?: boolean;
  className?: string;
}) {
  const cellClass = (c: Column<T>) =>
    cx(c.mono && "lk-cell--mono", c.align === "right" && "lk-cell--right", c.align === "center" && "lk-cell--center");
  return (
    <table className={cx("lk-table", dense && "lk-table--dense", onRowClick && "lk-table--click", className)}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} className={cellClass(c)} style={c.width != null ? { width: c.width } : undefined}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={rowKey(row, i)} onClick={onRowClick ? () => onRowClick(row, i) : undefined}>
            {columns.map((c) => (
              <td key={c.key} className={cellClass(c)}>
                {c.render ? c.render(row, i) : ((row as Record<string, unknown>)[c.key] as ReactNode)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------- Description list ---------- */
export interface DescItem {
  term: ReactNode;
  desc: ReactNode;
}
export function DescList({ items, className }: { items: DescItem[]; className?: string }) {
  return (
    <dl className={cx("lk-desc", className)}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "contents" }}>
          <dt>{it.term}</dt>
          <dd>{it.desc}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Stat ---------- */
export function Stat({
  label,
  value,
  delta,
  tone = "grounded",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  /** tone of the delta line */
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cx("lk-stat", className)}>
      <span className="lk-stat__label">{label}</span>
      <span className="lk-stat__value">{value}</span>
      {delta && <span className={cx("lk-stat__delta", toneClass(tone))}>{delta}</span>}
    </div>
  );
}

/* ---------- Avatar ---------- */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}
export function Avatar({
  name,
  size = "md",
  tone,
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cx("lk-avatar", size !== "md" && `lk-avatar--${size}`, tone && "lk-avatar--toned", tone && toneClass(tone), className)}
      title={name}
    >
      {initialsOf(name)}
    </span>
  );
}
export function AvatarGroup({ names, size = "md", className }: { names: string[]; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span className={cx("lk-avatar-group", className)}>
      {names.map((n) => (
        <Avatar key={n} name={n} size={size} />
      ))}
    </span>
  );
}

/* ---------- Skeleton / Spinner ---------- */
export function Skeleton({
  width,
  height = 12,
  className,
  style,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
}) {
  return <span className={cx("lk-skel", className)} style={{ display: "block", width, height, ...style }} aria-hidden />;
}
export function Spinner({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  return <span className={cx("lk-spin", size === "sm" && "lk-spin--sm", className)} role="status" aria-label="loading" />;
}

/* ---------- Empty state ---------- */
export function EmptyState({
  glyph = "◌",
  title,
  hint,
  action,
  className,
}: {
  glyph?: ReactNode;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("lk-empty", className)}>
      <span className="lk-empty__glyph">{glyph}</span>
      <span className="lk-empty__title">{title}</span>
      {hint && <span className="lk-empty__hint">{hint}</span>}
      {action && <span className="lk-empty__act">{action}</span>}
    </div>
  );
}

/* ---------- Timeline ---------- */
export interface TimelineItem {
  title: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
  tone?: Tone;
}
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <div className={cx("lk-tl", className)}>
      {items.map((it, i) => (
        <div className="lk-tl__item" key={i}>
          <span className="lk-tl__rail">
            <StateDot state={it.tone ?? "neutral"} size="sm" />
            <span className="lk-tl__line" />
          </span>
          <div className="lk-tl__body">
            <div className="lk-tl__title">{it.title}</div>
            {it.meta && <div className="lk-tl__meta">{it.meta}</div>}
            {it.body && <div className="lk-tl__text">{it.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Breadcrumb ---------- */
export interface Crumb {
  label: ReactNode;
  href?: string;
}
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav className={cx("lk-crumbs", className)} aria-label="breadcrumb">
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} style={{ display: "contents" }}>
            {c.href && !last ? <a href={c.href}>{c.label}</a> : <span className={last ? "lk-crumbs__cur" : undefined}>{c.label}</span>}
            {!last && <span className="lk-crumbs__sep">·</span>}
          </span>
        );
      })}
    </nav>
  );
}

/* ---------- Pagination ---------- */
function pageWindow(page: number, count: number): Array<number | "gap"> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: Array<number | "gap"> = [1];
  const lo = Math.max(2, page - 1);
  const hi = Math.min(count - 1, page + 1);
  if (lo > 2) out.push("gap");
  for (let p = lo; p <= hi; p++) out.push(p);
  if (hi < count - 1) out.push("gap");
  out.push(count);
  return out;
}
export function Pagination({
  page,
  count,
  onChange,
  className,
}: {
  page: number;
  count: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  return (
    <nav className={cx("lk-pager", className)} aria-label="pagination">
      <button type="button" className="lk-pager__btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="previous">
        ◂
      </button>
      {pageWindow(page, count).map((p, i) =>
        p === "gap" ? (
          <span key={`g${i}`} className="lk-pager__gap">
            …
          </span>
        ) : (
          <button
            type="button"
            key={p}
            className="lk-pager__btn"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" className="lk-pager__btn" disabled={page >= count} onClick={() => onChange(page + 1)} aria-label="next">
        ▸
      </button>
    </nav>
  );
}

/* ---------- Steps ---------- */
export interface StepItem {
  label: ReactNode;
  hint?: ReactNode;
}
export function Steps({ steps, current, className }: { steps: StepItem[]; current: number; className?: string }) {
  return (
    <div className={cx("lk-steps", className)}>
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <div className={cx("lk-step", state !== "todo" && `lk-step--${state}`)} key={i}>
            <span className="lk-step__bar" />
            <span className="lk-step__dot">{state === "done" ? "✓" : i + 1}</span>
            <span className="lk-step__label">{s.label}</span>
            {s.hint && <span className="lk-step__hint">{s.hint}</span>}
          </div>
        );
      })}
    </div>
  );
}
