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

          // 1. Ask server to start PKCE flow — get auth URL + a device code for polling
          const beginRes = await fetch("/api/mobile-auth/begin", {
            credentials: "include",
          });
          const { authorizationUrl, deviceCode } =
            (await beginRes.json()) as {
              authorizationUrl: string;
              deviceCode: string;
            };

          // 2. Poll server every 2 s until auth completes
          let pollTimer: ReturnType<typeof setInterval> | null = null;
          let done = false;

          const finish = async (sid: string) => {
            if (done) return;
            done = true;
            if (pollTimer) clearInterval(pollTimer);

            // Activate the session cookie inside the WebView
            await fetch("/api/mobile-auth/activate-cookie", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ sid }),
            });

            // Close Chrome Custom Tabs
            await Browser.close().catch(() => {});

            // Update auth state
            const u = await fetchUser();
            if (u) {
              setUser(u);
              setIsLoading(false);
            }
          };

          pollTimer = setInterval(async () => {
            if (done) return;
            try {
              const pollRes = await fetch(
                `/api/mobile-auth/poll?deviceCode=${encodeURIComponent(deviceCode)}`,
                { credentials: "include" },
              );
              const data = (await pollRes.json()) as {
                ready: boolean;
                sid?: string;
              };
              if (data.ready && data.sid) {
                await finish(data.sid);
              }
            } catch {
              // network hiccup — keep polling
            }
          }, 2000);

          // Stop polling if user manually closes the browser without signing in
          await Browser.addListener("browserFinished", () => {
            // Give one extra poll attempt before giving up (race condition guard)
            setTimeout(() => {
              if (!done && pollTimer) clearInterval(pollTimer);
            }, 4000);
          });

          // 3. Open Replit OAuth in Chrome Custom Tabs
          await Browser.open({ url: authorizationUrl });
        } catch {
          // Capacitor not available or fetch failed — fall back to redirect
          window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
        }
      })();
      return;
    }

    // Desktop browsers: popup window
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
