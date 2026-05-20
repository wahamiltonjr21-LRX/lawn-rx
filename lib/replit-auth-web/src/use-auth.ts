import { useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@workspace/api-client-react";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

async function fetchUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: AuthUser | null };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchUser().then((u) => {
      if (!cancelled) {
        setUser(u);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";
    const loginUrl = `/api/login?returnTo=${encodeURIComponent(base)}&popup=1`;

    const popup = window.open(
      loginUrl,
      "lawnrx_auth",
      "width=520,height=720,popup=yes,left=200,top=80",
    );

    if (!popup) {
      window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
      return;
    }

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        fetchUser().then((u) => {
          if (u) {
            setUser(u);
            setIsLoading(false);
          }
        });
      }
    }, 400);
  }, []);

  const logout = useCallback(() => {
    window.location.href = "/api/logout";
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
