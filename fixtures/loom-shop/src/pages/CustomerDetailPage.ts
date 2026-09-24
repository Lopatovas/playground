import { useCustomerStore } from "../stores/useCustomerStore.js";
import { CustomerCard } from "../components/CustomerCard.js";
import { Modal } from "../components/Modal.js";
import { PageHeading } from "../components/PageHeading.js";

export function CustomerDetailPage() {
  const store = useCustomerStore();
  return {
    route: "/customers/:id",
    heading: PageHeading("Customer"),
    card: CustomerCard(store.load("1")),
    edit: Modal("Edit customer"),
  };
}
