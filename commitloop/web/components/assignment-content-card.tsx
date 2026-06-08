import { Markdown } from "@/components/markdown";

export function AssignmentContentCard({ source }: { source: string }) {
  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <Markdown source={source} />
    </div>
  );
}
