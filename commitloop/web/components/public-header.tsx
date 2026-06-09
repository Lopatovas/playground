import type { CSSProperties, ReactNode } from "react";
import { Logo } from "@/components/logo";

export function PublicHeader({
  className = "",
  style,
  actions,
}: {
  className?: string;
  style?: CSSProperties;
  actions?: ReactNode;
}) {
  return (
    <header
      className={`app-header ${className}`.trim()}
      style={style}
    >
      <Logo href="/" />
      {actions ? <div className="public-header__actions">{actions}</div> : null}
    </header>
  );
}
