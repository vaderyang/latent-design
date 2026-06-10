/** Latent kit — App Attention Grammar layout primitives.
 *  The five attention zones, with their role styling fixed (what is lit vs what
 *  recedes); each app supplies its own grid-template-areas over them.
 *
 *  Zone area names for `areas`:  stage · art · act · ctx · intervene */
import type { CSSProperties, ReactNode } from "react";
import { cx } from "./types.ts";

export type ZoneRole = "stage" | "artifact" | "activity" | "context" | "intervene";

const AREA: Record<ZoneRole, string> = {
  stage: "stage",
  artifact: "art",
  activity: "act",
  context: "ctx",
  intervene: "intervene",
};

export function ZoneLayout({
  areas,
  columns,
  rows,
  gap,
  children,
  className,
  style,
}: {
  /** grid-template-areas string, e.g. `"ctx stage" "act stage"` */
  areas?: string;
  columns?: string;
  rows?: string;
  gap?: string | number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cx("lk-zones", className)}
      style={{ gridTemplateAreas: areas, gridTemplateColumns: columns, gridTemplateRows: rows, ...(gap != null ? { gap } : {}), ...style }}
    >
      {children}
    </div>
  );
}

export function Zone({
  role,
  head,
  children,
  className,
  style,
}: {
  role: ZoneRole;
  head?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cx("lk-zone", `lk-zone--${role}`, className)} style={{ gridArea: AREA[role], ...style }}>
      {head && <div className="lk-zone__head">{head}</div>}
      {children}
    </div>
  );
}
