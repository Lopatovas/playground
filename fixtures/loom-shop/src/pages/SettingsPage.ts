import { Button } from "../components/Button.js";
import { SettingsHeading } from "../components/SettingsHeading.js";

export function SettingsPage() {
  return {
    route: "/settings",
    heading: SettingsHeading("Workspace settings"),
    save: Button("Save"),
  };
}
