import { Button } from "./Button.js";

export function CustomerCard(customer) {
  return { kind: "card", customer, action: Button("Open") };
}
