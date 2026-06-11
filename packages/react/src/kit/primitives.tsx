/** Latent kit — general-purpose primitives, themed by the design language.
 *  All schema-free: simple props, drop into any React app. */
import { useState } from "react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { cx, toneClass } from "./types.ts";
import type { Tone } from "./types.ts";

/* ---------- Button ---------- */
export type ButtonVariant = "default" | "primary" | "ghost";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  /** optional epistemic accent (tints text + hover) */
  tone?: Tone;
  block?: boolean;
  /** icon-only square button */
  icon?: boolean;
}
export function Button({
  variant = "default",
  size = "md",
  tone,
  block,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "lk-btn",
        variant !== "default" && `lk-btn--${variant}`,
        size !== "md" && `lk-btn--${size}`,
        tone && "lk-btn--toned",
        tone && toneClass(tone),
        block && "lk-btn--block",
        icon && "lk-btn--icon",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Icon-only button (square padding). */
export function IconButton({ icon = true, ...props }: ButtonProps) {
  return <Button icon={icon} {...props} />;
}

/* ---------- Badge ---------- */
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("lk-badge", toneClass(tone), className)}>{children}</span>;
}

/* ---------- Tag ---------- */
export function Tag({ mono, children, className }: { mono?: boolean; children: ReactNode; className?: string }) {
  return <span className={cx("lk-tag", mono && "lk-tag--mono", className)}>{children}</span>;
}

/* ---------- Chip (selectable / removable) ---------- */
export interface ChipProps {
  children: ReactNode;
  tone?: Tone;
  pressed?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  className?: string;
}
export function Chip({ children, tone = "hypothesis", pressed, onToggle, onRemove, className }: ChipProps) {
  const interactive = !!onToggle;
  return (
    <span
      className={cx("lk-chip", toneClass(tone), className)}
      role={interactive ? "button" : undefined}
      aria-pressed={interactive ? !!pressed : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onToggle}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle?.();
              }
            }
          : undefined
      }
    >
      {children}
      {onRemove && (
        <button
          type="button"
          className="lk-chip__x"
          aria-label="remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

/* ---------- Card ---------- */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  inset?: boolean;
  flat?: boolean;
  padSm?: boolean;
}
export function Card({ tone, inset, flat, padSm, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "lk-card",
        tone && "lk-card--toned",
        tone && toneClass(tone),
        inset && "lk-card--inset",
        flat && "lk-card--flat",
        padSm && "lk-card--pad-sm",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------- Panel (titled section) ---------- */
export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("lk-panel", className)}>
      {(title || actions) && (
        <div className="lk-panel__head">
          <span>{title}</span>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------- Meter ---------- */
export interface MeterProps {
  /** 0..1 */
  value: number;
  tone?: Tone;
  /** hypo→grounded gradient fill (ignores tone) */
  gradient?: boolean;
  label?: string;
  showValue?: boolean;
  format?: (v: number) => string;
  /** trailing caption pill (e.g. a source) */
  caption?: ReactNode;
  className?: string;
}
export function Meter({ value, tone = "hypothesis", gradient, label, showValue = true, format, caption, className }: MeterProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={cx("lk-meter", gradient ? "lk-meter--gradient" : toneClass(tone), className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Math.max(0, Math.min(1, value))}
      aria-label={label ?? "value"}
    >
      {label && <span className="lk-meter__lab">{label}</span>}
      <div className="lk-meter__track">
        <div className="lk-meter__fill" style={{ width: `${pct}%` }} />
      </div>
      {showValue && <span className="lk-meter__val">{format ? format(value) : value.toFixed(2)}</span>}
      {caption && <span className="lk-meter__src">{caption}</span>}
    </div>
  );
}

/* ---------- Disclosure ---------- */
export interface DisclosureProps {
  summary: ReactNode;
  openSummary?: ReactNode;
  defaultOpen?: boolean;
  /** controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}
export function Disclosure({ summary, openSummary, defaultOpen = false, open, onOpenChange, children, className }: DisclosureProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const isOpen = open ?? internal;
  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };
  return (
    <div className={className}>
      <button type="button" className="lk-disc__toggle" aria-expanded={isOpen} onClick={toggle}>
        <span>{isOpen ? "▾" : "▸"}</span>
        {isOpen ? openSummary ?? summary : summary}
      </button>
      {isOpen && <div className="lk-disc__body">{children}</div>}
    </div>
  );
}

/* ---------- Segmented control ---------- */
export interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
}
export interface SegmentedProps<T extends string> {
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}
export function Segmented<T extends string>({ options, value, onChange, ariaLabel, className }: SegmentedProps<T>) {
  return (
    <div className={cx("lk-seg", className)} role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className="lk-seg__btn"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Tabs ---------- */
export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
}
export function Tabs({ items, defaultValue, className }: { items: TabItem[]; defaultValue?: string; className?: string }) {
  const [v, setV] = useState(defaultValue ?? items[0]?.value ?? "");
  const active = items.find((i) => i.value === v);
  return (
    <div className={className}>
      <Segmented options={items.map((i) => ({ value: i.value, label: i.label }))} value={v} onChange={setV} />
      <div className="lk-tabs__panel" role="tabpanel">
        {active?.content}
      </div>
    </div>
  );
}

/* ---------- Switch ---------- */
export function Switch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  className?: string;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={cx("lk-switch", className)} onClick={() => onChange(!checked)}>
      <span className="lk-switch__track">
        <span className="lk-switch__knob" />
      </span>
      {label && <span className="lk-switch__label">{label}</span>}
    </button>
  );
}

/* ---------- Field / Input / Textarea ---------- */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("lk-field", !!error && "lk-field--error", className)}>
      {label && <label className="lk-field__label">{label}</label>}
      {children}
      {error ? <span className="lk-field__err">{error}</span> : hint ? <span className="lk-field__hint">{hint}</span> : null}
    </div>
  );
}
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("lk-input", className)} {...rest} />;
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("lk-textarea", className)} {...rest} />;
}

/* ---------- Callout ---------- */
export function Callout({
  tone = "hypothesis",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("lk-callout", toneClass(tone), className)}>
      {title && <span className="lk-callout__title">{title}</span>}
      {children}
    </div>
  );
}

/* ---------- Divider ---------- */
export function Divider({ label, align = "center", className }: { label?: ReactNode; align?: "start" | "center" | "end"; className?: string }) {
  return (
    <div className={cx("lk-divider", align !== "center" && `lk-divider--${align}`, className)}>
      {label && <span className="lk-divider__label">{label}</span>}
    </div>
  );
}

/* ---------- Kbd ---------- */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cx("lk-kbd", className)}>{children}</kbd>;
}

/* ---------- Tooltip ---------- */
export function Tooltip({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cx("lk-tip", className)} tabIndex={0}>
      {children}
      <span className="lk-tip__bub" role="tooltip">
        {label}
      </span>
    </span>
  );
}
