import { get } from "./httpClient.js";

export function listInvoices(customerId) {
  return get("/invoices", { customerId });
}
