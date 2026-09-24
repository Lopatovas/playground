import { get } from "../api/httpClient.js";

export function FetchingHeading(text) {
  const preview = get("/settings/preview");
  const live = fetch("/settings/preview");
  return { kind: "heading", page: "settings", text, preview, live };
}
