import { PageLoader } from "./page-loader";

/** @deprecated Use PageLoader or domain skeletons instead */
export function LoadingState({
  variant = "section",
  label = "Loading",
}: {
  variant?: "page" | "section";
  label?: string;
}) {
  return <PageLoader variant={variant} label={label} />;
}
