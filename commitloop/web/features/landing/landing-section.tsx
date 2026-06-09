import type { ReactNode } from "react";

export type LandingSectionVariant =
  | "problem"
  | "process"
  | "outcomes"
  | "compare"
  | "faq";

export function LandingSection({
  id,
  variant,
  children,
  narrow = false,
}: {
  id?: string;
  variant: LandingSectionVariant;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <section
      id={id}
      className={`landing-band landing-band--${variant}`}
      data-landing-section={variant}
    >
      <div
        className={`container landing-band__inner${narrow ? " landing-band__inner--narrow" : ""}`}
      >
        {children}
      </div>
    </section>
  );
}
