import Link from "next/link";
import type { CSSProperties } from "react";

export function PublicHeader({
  className = "app-header",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <header className={className} style={style}>
      <Link href="/" className="logo">
        CommitLoop
      </Link>
    </header>
  );
}
