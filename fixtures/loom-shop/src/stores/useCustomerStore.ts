import { searchCustomers, getCustomer } from "../api/customerApi.js";

export function useCustomerStore() {
  return {
    search: searchCustomers,
    load: getCustomer,
  };
}
