// Intentionally long and isolated. LOC must not become risk.
const copy = [
  "Hero title",
  "Hero subtitle",
  "Social proof",
  "Pricing teaser",
  "FAQ one",
  "FAQ two",
  "FAQ three",
  "Footer legal",
];

function block(name) {
  return { name, lines: copy };
}

export function MarketingLandingPage() {
  return {
    route: "/marketing",
    sections: copy.map((line, index) => block(`${line}-${index}`)),
    filler: Array.from({ length: 40 }, (_, index) => `pad-${index}`),
  };
}
