"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { api, type User } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((u) => {
        setUser(u);
        if (u.repo) {
          setOwner(u.repo.owner);
          setName(u.repo.name);
        }
      })
      .catch(() => router.push("/"));
  }, [router]);

  async function saveRepo(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.setRepo(owner, name);
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: "3rem 0" }}>
        Loading…
      </div>
    );
  }

  const rows = [
    { label: "GitHub", value: `@${user.username}`, action: null },
    {
      label: "Project repo",
      value: user.repo ? `${user.repo.owner} / ${user.repo.name}` : "Not set",
      action: null,
    },
    { label: "Track", value: "Track 1 — Fundamentals", action: null },
    {
      label: "Community",
      value: "Discord",
      action: process.env.NEXT_PUBLIC_DISCORD_URL ?? null,
    },
  ];

  return (
    <div className="container" style={{ padding: "1rem 0 3rem" }}>
      <AppHeader user={user} />

      <h1 style={{ marginBottom: "1.5rem" }}>Settings</h1>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr auto",
              gap: "1rem",
              padding: "0.75rem 0",
              borderBottom: "1px solid var(--border)",
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              {row.label}
            </span>
            <span>{row.value}</span>
            {row.action ? (
              <a href={row.action} target="_blank" rel="noreferrer">
                Open →
              </a>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Project repository</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          CommitLoop tracks commits on this repo for your streak.
        </p>
        <form onSubmit={saveRepo}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div className="field">
              <label htmlFor="owner">Owner</label>
              <input
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="name">Repository</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          {error ? (
            <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{error}</p>
          ) : null}
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save repository"}
          </button>
        </form>
      </div>
    </div>
  );
}
