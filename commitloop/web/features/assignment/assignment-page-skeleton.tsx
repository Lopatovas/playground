import { Skeleton, SkeletonCard, SkeletonText } from "@/components/skeleton";

export function AssignmentPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading assignment">
      <Skeleton width={56} height={14} style={{ marginBottom: "1rem" }} />
      <Skeleton width="55%" height={28} style={{ marginBottom: "1rem" }} />

      <div className="tabs" style={{ marginBottom: "1rem" }}>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            width={72}
            height={32}
            rounded="md"
            style={{ marginRight: "0.5rem" }}
          />
        ))}
      </div>

      <SkeletonCard>
        <SkeletonText lines={5} />
        <Skeleton
          width="40%"
          height={14}
          style={{ marginTop: "1rem" }}
        />
      </SkeletonCard>
    </div>
  );
}
