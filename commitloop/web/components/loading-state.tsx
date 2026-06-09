export function LoadingState({
  variant = "section",
}: {
  variant?: "page" | "section";
}) {
  return (
    <div style={{ padding: variant === "page" ? "3rem 0" : "2rem 0" }}>
      Loading…
    </div>
  );
}
