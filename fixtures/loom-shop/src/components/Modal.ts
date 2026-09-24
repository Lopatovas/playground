import { Button } from "./Button.js";

export function Modal(title) {
  return { kind: "modal", title, close: Button("Close") };
}
