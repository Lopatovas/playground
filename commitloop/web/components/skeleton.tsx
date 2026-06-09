import type { CSSProperties, ReactNode } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "full";
};

export function Skeleton({
  className = "",
  style,
  width,
  height,
  rounded = "sm",
}: SkeletonProps) {
  return (
    <span
      className={`skeleton skeleton--${rounded} ${className}`.trim()}
      style={{ width, height, ...style }}
      aria-hidden
    />
  );
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
}: {
  lines?: number;
  lastLineWidth?: string;
}) {
  return (
    <div className="skeleton-text" aria-hidden>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={14}
          width={index === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ children }: { children: ReactNode }) {
  return <div className="card skeleton-card">{children}</div>;
}
