import { Skeleton, SkeletonCard, SkeletonText } from "@/components/skeleton";

export function HomePageSkeleton() {
  return (
    <div className="home-grid" aria-busy="true" aria-label="Loading dashboard">
      <SkeletonCard>
        <Skeleton width={120} height={12} />
        <Skeleton
          width="75%"
          height={24}
          style={{ marginTop: "0.75rem" }}
        />
        <Skeleton
          width={100}
          height={14}
          style={{ marginTop: "0.5rem" }}
        />
        <div style={{ marginTop: "1rem" }}>
          <SkeletonText lines={2} lastLineWidth="90%" />
        </div>
        <Skeleton
          width={160}
          height={38}
          rounded="md"
          style={{ marginTop: "1.25rem" }}
        />
      </SkeletonCard>

      <SkeletonCard>
        <Skeleton width={100} height={12} />
        <div
          className="stat-grid"
          style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }}
        >
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index}>
              <Skeleton width={48} height={10} />
              <Skeleton
                width={36}
                height={22}
                style={{ marginTop: "0.35rem" }}
              />
            </div>
          ))}
        </div>
        <div className="heatmap">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} width={24} height={24} rounded="sm" />
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
