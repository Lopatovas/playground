"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { api, type User } from "@/lib/api";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  refreshUser: () => Promise<User | null>;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await api.me();
      setUser(nextUser);
      setStatus("authenticated");
      return nextUser;
    } catch {
      setUser(null);
      setStatus("anonymous");
      return null;
    }
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const nextUser = await api.me();
        if (cancelled) return;
        setUser(nextUser);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        setUser(null);
        setStatus("anonymous");
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ status, user, setUser, refreshUser, clearAuth }),
    [clearAuth, refreshUser, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
