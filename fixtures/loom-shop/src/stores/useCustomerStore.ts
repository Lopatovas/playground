import { searchCustomers, getCustomer } from "../api/customerApi.js";
import { requireSession } from "../auth/session.js";

export function useCustomerStore() {
  requireSession();
  return {
    search: searchCustomers,
    load: getCustomer,
  };
}
