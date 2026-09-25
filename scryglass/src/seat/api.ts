import type { FixturePr, ReviewSession } from "../domain/types.ts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  const response = await fetch(path, {
    ...init,
    headers,
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const err = data as { error?: string };
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }
  return data as T;
}

export function listPrs(): Promise<{ prs: FixturePr[] }> {
  return request("/api/prs");
}

export function openSession(input: string): Promise<{ session: ReviewSession }> {
  const body = input.startsWith("http") ? { url: input } : { prId: input };
  return request("/api/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function health(): Promise<{
  ok: boolean;
  hosts: { fixture: boolean; bitbucket: boolean; bitbucketEdition: string | null };
}> {
  return request("/api/health");
}

export function getSession(id: string): Promise<{ session: ReviewSession }> {
  return request(`/api/sessions/${id}`);
}

export function readFile(sessionId: string, path: string): Promise<{ path: string; text: string }> {
  return request(`/api/sessions/${sessionId}/file?path=${encodeURIComponent(path)}`);
}

export function addComment(
  sessionId: string,
  input: { body: string; file?: string; line?: number },
): Promise<{ session: ReviewSession }> {
  return request(`/api/sessions/${sessionId}/comments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function publishDrafts(sessionId: string): Promise<{ session: ReviewSession }> {
  return request(`/api/sessions/${sessionId}/publish`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function closeSitting(sessionId: string): Promise<{ session: ReviewSession }> {
  return request(`/api/sessions/${sessionId}/sittings`, { method: "POST" });
}
