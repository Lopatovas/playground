export function getSession() {
  return { userId: "reviewer", role: "chapter-lead" };
}

export function requireSession() {
  return getSession();
}
