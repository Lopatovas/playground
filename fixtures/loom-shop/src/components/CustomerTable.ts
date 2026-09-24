import { Button } from "./Button.js";
import { CustomerCard } from "./CustomerCard.js";

export function CustomerTable(rows) {
  return {
    kind: "table",
    rows: rows.map((row) => CustomerCard(row)),
    more: Button("More"),
  };
}
