/** Latent kit — overlays: Modal, Drawer, Popover, Toast.
 *  Depth is the language's metaphor — overlays sit "above the water" with the
 *  deepest shadows in the scale. All close on Esc; scrims close on click. */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { cx, toneClass } from "./types.ts";
import type { Tone } from "./types.ts";
import { IconButton } from "./primitives.tsx";

function useEsc(active: boolean, onClose?: () => void) {
  useEffect(() => {
    if (!active || !onClose) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [active, onClose]);
}

function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  footer,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <div className="lk-scrim lk-scrim--center" onClick={onClose}>
        <div className={cx("lk-modal", className)} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="lk-modal__head">
            <div className="lk-modal__title">{title}</div>
            <IconButton variant="ghost" size="sm" aria-label="close" onClick={onClose}>
              ✕
            </IconButton>
          </div>
          <div className="lk-modal__body">{children}</div>
          {footer && <div className="lk-modal__foot">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

/* ---------- Drawer ---------- */
export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <div className="lk-scrim" onClick={onClose} />
      <div className={cx("lk-drawer", `lk-drawer--${side}`, className)} role="dialog" aria-modal="true">
        <div className="lk-drawer__head">
          <div className="lk-drawer__title">{title}</div>
          <IconButton variant="ghost" size="sm" aria-label="close" onClick={onClose}>
            ✕
          </IconButton>
        </div>
        {children}
      </div>
    </Portal>
  );
}

/* ---------- Popover (click-toggled, closes on outside click / Esc) ---------- */
export function Popover({
  trigger,
  align = "start",
  children,
  className,
}: {
  trigger: ReactNode;
  align?: "start" | "end";
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEsc(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <span className={cx("lk-pop", className)} ref={ref}>
      <span onClick={() => setOpen((o) => !o)} style={{ display: "inline-flex" }}>
        {trigger}
      </span>
      {open && <div className={cx("lk-pop__panel", align === "end" && "lk-pop__panel--end")}>{children}</div>}
    </span>
  );
}

/* ---------- Toast ---------- */
export interface ToastInput {
  title?: ReactNode;
  body?: ReactNode;
  tone?: Tone;
  /** ms before auto-dismiss; 0 = sticky */
  duration?: number;
}
interface ToastItem extends ToastInput {
  id: number;
}

const ToastCtx = createContext<((t: ToastInput) => void) | null>(null);

/** Wrap your app (or a subtree) once; call useToast() anywhere inside. */
export function Toaster({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = (t: ToastInput) => {
    const id = ++seq.current;
    setItems((xs) => [...xs, { ...t, id }]);
    const ms = t.duration ?? 4200;
    if (ms > 0) setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), ms);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {items.length > 0 && (
        <Portal>
          <div className="lk-toasts">
            {items.map((t) => (
              <div
                key={t.id}
                className={cx("lk-toast", toneClass(t.tone ?? "hypothesis"))}
                role="status"
                onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}
              >
                {t.title && <div className="lk-toast__title">{t.title}</div>}
                {t.body}
              </div>
            ))}
          </div>
        </Portal>
      )}
    </ToastCtx.Provider>
  );
}

/** Returns push(toast). Must be used inside <Toaster>. */
export function useToast(): (t: ToastInput) => void {
  const push = useContext(ToastCtx);
  if (!push) throw new Error("useToast must be used inside <Toaster>");
  return push;
}
