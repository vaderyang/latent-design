/** Latent kit — motion + typography voices.
 *  Motion narrates epistemic-state transitions; it is never mere decoration.
 *  Respects prefers-reduced-motion (handled in kit.css). */
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cx } from "./types.ts";

export type Motion = "surface" | "settle" | "sink" | "pulse";

/**
 * Reveal — wrap content to animate its arrival/transition.
 *   surface (new understanding rises) · settle (resolves) · sink (refuted, recedes)
 *   · pulse (a change-of-mind cue).
 */
export function Reveal({
  motion = "surface",
  as,
  delay,
  children,
  className,
  style,
}: {
  motion?: Motion;
  as?: ElementType;
  /** animation-delay in ms */
  delay?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const Tag = as ?? "div";
  return (
    <Tag className={cx("lk-reveal", `lk-reveal--${motion}`, className)} style={delay != null ? { animationDelay: `${delay}ms`, ...style } : style}>
      {children}
    </Tag>
  );
}

/* ---------- typography voices ----------
 * Cognition speaks in serif (deliberated); evidence reads in mono (instrument
 * output); functional UI text in the sans voice. */
interface VoiceProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}
export function Voice({ as, children, className, style }: VoiceProps) {
  const Tag = as ?? "span";
  return (
    <Tag className={cx("lk-voice", className)} style={style}>
      {children}
    </Tag>
  );
}
export function Mono({ as, children, className, style }: VoiceProps) {
  const Tag = as ?? "span";
  return (
    <Tag className={cx("lk-mono", className)} style={style}>
      {children}
    </Tag>
  );
}
export function UIText({ as, children, className, style }: VoiceProps) {
  const Tag = as ?? "span";
  return (
    <Tag className={cx("lk-uitext", className)} style={style}>
      {children}
    </Tag>
  );
}
