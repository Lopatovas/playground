"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type User } from "@/lib/api";

export function AppHeader({ user }: { user: User }) {
  const router = useRouter();

  return (
    <header className="app-header">
      <Link href="/home" className="logo">
        CommitLoop
      </Link>
      <nav>
        <Link href="/home">Home</Link>
        <Link href="/assignment">Assignment</Link>
        <Link href="/curriculum">Curriculum</Link>
        <Link href="/settings">Settings</Link>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          @{user.username}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
          onClick={() => api.logout().then(() => router.push("/"))}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
