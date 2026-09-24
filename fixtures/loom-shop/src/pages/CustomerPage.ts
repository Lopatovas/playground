import { useCustomerStore } from "../stores/useCustomerStore.js";
import { Button } from "../components/Button.js";
import { CustomerCard } from "../components/CustomerCard.js";
import { CustomerTable } from "../components/CustomerTable.js";
import { PageHeading } from "../components/PageHeading.js";

export function CustomerPage() {
  const store = useCustomerStore();
  return {
    route: "/customers",
    heading: PageHeading("Customers"),
    table: CustomerTable(store.search("")),
    featured: CustomerCard({ id: "1" }),
    search: Button("Search"),
  };
}
