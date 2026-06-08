"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/auth";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { clearAuth, status, user } = useAuth();

  useEffect(() => {
    if (status === "anonymous") {
      router.push("/");
    }
  }, [router, status]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="container" style={{ padding: "3rem 0" }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "1rem 0 3rem" }}>
      <AppHeader user={user} onLogout={clearAuth} />
      {children}
    </div>
  );
}
