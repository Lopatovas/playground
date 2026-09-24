export function get(path, query) {
  return { path, query, method: "GET" };
}

export function post(path, body) {
  return { path, body, method: "POST" };
}
