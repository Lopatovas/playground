import { Button } from "../components/Button.js";
import { FetchingHeading } from "../components/FetchingHeading.js";
import { SettingsHeading } from "../components/SettingsHeading.js";

export function SettingsPage() {
  return {
    route: "/settings",
    heading: SettingsHeading("Workspace settings"),
    liveHeading: FetchingHeading("Workspace preview"),
    save: Button("Save"),
  };
}
