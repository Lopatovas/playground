import { Skeleton, SkeletonCard } from "@/components/skeleton";

export function TrackStageListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonCard aria-busy="true" aria-label="Loading curriculum">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="stage-row"
          style={{ borderBottom: index === rows - 1 ? "none" : undefined }}
        >
          <Skeleton width={12} height={12} rounded="full" />
          <Skeleton width={`${55 + (index % 3) * 10}%`} height={16} />
          <Skeleton width={64} height={22} rounded="md" />
        </div>
      ))}
    </SkeletonCard>
  );
}
