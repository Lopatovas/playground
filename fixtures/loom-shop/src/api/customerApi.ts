import { get, post } from "./httpClient.js";

export function searchCustomers(query) {
  return get("/customers", { q: query });
}

export function getCustomer(id) {
  return get(`/customers/${id}`);
}

export function updateCustomer(id, body) {
  return post(`/customers/${id}`, body);
}
