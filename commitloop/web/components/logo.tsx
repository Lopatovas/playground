import Link from "next/link";

const MARK_PATH = (
  <>
    <rect
      x="3"
      y="3"
      width="22"
      height="22"
      rx="6"
      stroke="currentColor"
      strokeWidth="2.25"
      fill="none"
    />
    <text
      x="14"
      y="17.5"
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize="10.5"
      fontWeight="700"
      fill="currentColor"
    >
      CL
    </text>
  </>
);

export function LogoMark({
  className = "",
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      {MARK_PATH}
    </svg>
  );
}

export function Logo({
  href = "/",
  className = "",
  showWordmark = true,
}: {
  href?: string;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link href={href} className={`logo ${className}`.trim()}>
      <LogoMark className="logo__mark" />
      {showWordmark ? <span className="logo__wordmark">CommitLoop</span> : null}
    </Link>
  );
}
