import { searchCustomers } from "./customerApi.js";

export function testSearchCustomers() {
  return searchCustomers("ada");
}
