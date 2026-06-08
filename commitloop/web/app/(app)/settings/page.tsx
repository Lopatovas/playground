"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const { setUser, user } = useAuth();
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOwner(user?.repo?.owner ?? "");
    setName(user?.repo?.name ?? "");
  }, [user?.repo?.name, user?.repo?.owner]);

  async function saveRepo(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { repo } = await api.setRepo(owner, name);
      setUser((current) => (current ? { ...current, repo } : current));
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const rows = [
    { label: "GitHub", value: `@${user?.username}`, action: null },
    {
      label: "Project repo",
      value: user?.repo ? `${user.repo.owner} / ${user.repo.name}` : "Not set",
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
    <>
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
    </>
  );
}
