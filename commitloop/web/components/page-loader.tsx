export function PageLoader({
  label = "Loading",
  variant = "section",
}: {
  label?: string;
  variant?: "page" | "section";
}) {
  return (
    <div
      className={`page-loader page-loader--${variant}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="page-loader__ring" aria-hidden />
      <span className="page-loader__brand">CommitLoop</span>
      <span className="page-loader__label">{label}</span>
    </div>
  );
}
