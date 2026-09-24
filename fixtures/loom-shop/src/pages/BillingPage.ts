import { useBillingStore } from "../stores/useBillingStore.js";
import { Button } from "../components/Button.js";
import { PageHeading } from "../components/PageHeading.js";

export function BillingPage() {
  const store = useBillingStore();
  return {
    route: "/billing",
    heading: PageHeading("Billing"),
    invoices: store.invoices("1"),
    exportCsv: Button("Export"),
  };
}
