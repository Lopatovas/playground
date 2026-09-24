import { listInvoices } from "../api/billingApi.js";

export function useBillingStore() {
  return {
    invoices: listInvoices,
  };
}
