/** Latent kit — navigation & shell pieces: NavList, Toolbar.
 *  These pair with ZoneLayout (the App Attention Grammar): NavList lives in the
 *  Context zone (recessive), Toolbar is the top chrome. Active state uses the
 *  hypothesis accent — "where you are" is the live thread. */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./types.ts";

/* ---------- NavList ---------- */
export function NavList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav className={cx("lk-nav", className)} role="navigation">
      {children}
    </nav>
  );
}

export function NavGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("lk-nav__group", className)}>{children}</div>;
}

type NavAnchor = { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>;
type NavButton = { href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>;
export type NavItemProps = (NavAnchor | NavButton) & {
  active?: boolean;
  icon?: ReactNode;
  /** trailing element, e.g. a Badge */
  badge?: ReactNode;
  children: ReactNode;
};
export function NavItem(props: NavItemProps) {
  const { active, icon, badge, children, className, ...rest } = props;
  const inner = (
    <>
      {icon && <span aria-hidden>{icon}</span>}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</span>
      {badge && <span className="lk-nav__badge">{badge}</span>}
    </>
  );
  if ("href" in rest && rest.href !== undefined) {
    return (
      <a className={cx("lk-nav__item", className)} aria-current={active ? "page" : undefined} {...(rest as NavAnchor)}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cx("lk-nav__item", className)} aria-current={active ? "true" : undefined} {...(rest as NavButton)}>
      {inner}
    </button>
  );
}

/* ---------- Toolbar ---------- */
export function Toolbar({ title, children, className }: { title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cx("lk-toolbar", className)} role="toolbar">
      {title && <span className="lk-toolbar__title">{title}</span>}
      {children}
    </div>
  );
}
export function ToolbarSpacer() {
  return <span className="lk-toolbar__spacer" />;
}
