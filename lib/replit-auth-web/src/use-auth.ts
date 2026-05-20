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

function isCapacitor(): boolean {
  return (
    typeof (window as unknown as Record<string, unknown>).Capacitor !==
    "undefined"
  );
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const recheck = () => {
      if (!document.hidden) {
        fetchUser().then((u) => {
          if (!cancelled && u) {
            setUser(u);
            setIsLoading(false);
          }
        });
      }
    };

    fetchUser().then((u) => {
      if (!cancelled) {
        setUser(u);
        setIsLoading(false);
      }
    });

    document.addEventListener("visibilitychange", recheck);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  const login = useCallback(() => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";

    if (isCapacitor()) {
      (async () => {
        try {
          const { Browser } = await import("@capacitor/browser");
          const { App } = await import("@capacitor/app");

          const res = await fetch("/api/mobile-auth/begin", {
            credentials: "include",
          });
          const { authorizationUrl } = (await res.json()) as {
            authorizationUrl: string;
          };

          let urlListener: { remove: () => void } | null = null;
          let browserListener: { remove: () => void } | null = null;

          const cleanup = () => {
            urlListener?.remove();
            browserListener?.remove();
          };

          urlListener = await App.addListener("appUrlOpen", async (event) => {
            let url: URL;
            try {
              url = new URL(event.url);
            } catch {
              return;
            }

            if (url.protocol !== "com.lawnrx.app:") return;
            cleanup();
            await Browser.close().catch(() => {});

            if (url.host === "auth-complete") {
              const sid = url.searchParams.get("sid");
              if (sid) {
                await fetch("/api/mobile-auth/activate-cookie", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ sid }),
                });
                const u = await fetchUser();
                if (u) {
                  setUser(u);
                  setIsLoading(false);
                }
              }
            }
          });

          browserListener = await Browser.addListener(
            "browserFinished",
            () => {
              cleanup();
            },
          );

          await Browser.open({ url: authorizationUrl });
        } catch {
          window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
        }
      })();
      return;
    }

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
