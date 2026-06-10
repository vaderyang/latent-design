/** Latent kit — form controls beyond Input/Textarea/Switch.
 *  Native elements under the hood (a11y + form semantics for free), styled by
 *  the design language. Interaction colour is hypothesis-cyan ("in play"). */
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cx } from "./types.ts";

/* ---------- Checkbox ---------- */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}
export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx("lk-check", className)}>
      <input type="checkbox" {...rest} />
      <span className="lk-check__box" />
      {label && <span>{label}</span>}
    </label>
  );
}

/* ---------- Radio / RadioGroup ---------- */
export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}
export function Radio({ label, className, ...rest }: RadioProps) {
  return (
    <label className={cx("lk-check", "lk-check--radio", className)}>
      <input type="radio" {...rest} />
      <span className="lk-check__box" />
      {label && <span>{label}</span>}
    </label>
  );
}

export interface RadioOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}
export function RadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  row,
  className,
}: {
  name: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  row?: boolean;
  className?: string;
}) {
  return (
    <div className={cx("lk-radio-group", row && "lk-radio-group--row", className)} role="radiogroup">
      {options.map((o) => (
        <Radio
          key={o.value}
          name={name}
          label={o.label}
          checked={o.value === value}
          disabled={o.disabled}
          onChange={() => onChange(o.value)}
        />
      ))}
    </div>
  );
}

/* ---------- Select (native, styled) ---------- */
export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
  placeholder?: string;
}
export function Select({ options, placeholder, className, ...rest }: SelectProps) {
  return (
    <span className={cx("lk-select", className)}>
      <select {...rest}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

/* ---------- Slider (native range, styled) ---------- */
export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}
export function Slider({ value, onChange, min = 0, max = 100, step = 1, className, ...rest }: SliderProps) {
  return (
    <input
      type="range"
      className={cx("lk-slider", className)}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      {...rest}
    />
  );
}
