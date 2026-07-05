"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { RepoSettingsForm } from "@/features/settings/repo-settings-form";
import { SettingsDetails } from "@/features/settings/settings-details";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const { setUser, user } = useAuth();
  const [owner, setOwner] = useState(() => user?.repo?.owner ?? "");
  const [name, setName] = useState(() => user?.repo?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    { label: "Track", value: "Track 1 — Web Systems", action: null },
    {
      label: "Community",
      value: "Discord",
      action: process.env.NEXT_PUBLIC_DISCORD_URL ?? null,
    },
  ];

  return (
    <>
      <h1 style={{ marginBottom: "1.5rem" }}>Settings</h1>

      <SettingsDetails rows={rows} />

      <RepoSettingsForm
        error={error}
        name={name}
        owner={owner}
        saving={saving}
        onNameChange={setName}
        onOwnerChange={setOwner}
        onSubmit={saveRepo}
      />
    </>
  );
}
