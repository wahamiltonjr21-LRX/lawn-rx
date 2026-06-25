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

let _apiBase = "";

const STORAGE_KEY = "lawnrx_cap_sid";

/**
 * Set the base URL for all auth-related fetch calls.
 * Required in Capacitor builds where the WebView serves local files
 * and API calls must target the live server explicitly.
 * Call this once at app startup before rendering.
 */
export function setAuthApiBase(url: string): void {
  _apiBase = url.replace(/\/+$/, "");
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(sid: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, sid);
  } catch {}
}

function clearToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(`${_apiBase}${path}`, { ...init, headers });
}

async function fetchUser(): Promise<AuthUser | null> {
  try {
    const res = await authFetch("/api/auth/user", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: AuthUser | null };
    return data.user ?? null;
  } catch {
    return null;
  }
}

function isCapacitor(): boolean {
  const cap = (window as unknown as Record<string, unknown>).Capacitor;
  if (cap && typeof (cap as Record<string, unknown>).isNativePlatform === "function") {
    return (cap as { isNativePlatform: () => boolean }).isNativePlatform();
  }
  return typeof cap !== "undefined";
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
    const base = import.meta.env.BASE_URL?.replace(/\/+$/, "") || "/";

    if (isCapacitor()) {
      (async () => {
        try {
          const { Browser } = await import("@capacitor/browser");

          const beginRes = await authFetch("/api/mobile-auth/begin", {
            credentials: "include",
          });
          const { authorizationUrl, deviceCode } =
            (await beginRes.json()) as {
              authorizationUrl: string;
              deviceCode: string;
            };

          let pollTimer: ReturnType<typeof setInterval> | null = null;
          let done = false;

          const finish = async (sid: string) => {
            if (done) return;
            done = true;
            if (pollTimer) clearInterval(pollTimer);

            // Store token in localStorage — bypasses SameSite cookie issues
            // from file:// WebView origin. Bearer token is sent on every
            // subsequent API call via authFetch and setAuthTokenGetter.
            storeToken(sid);

            // Also set cookie as fallback for web-based requests
            await authFetch("/api/mobile-auth/activate-cookie", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ sid }),
            }).catch(() => {});

            await Browser.close().catch(() => {});

            // Retry fetchUser up to 5 times with backoff — the session may
            // not be immediately readable after the browser closes on slow
            // connections.
            let u: AuthUser | null = null;
            for (let attempt = 0; attempt < 5; attempt++) {
              if (attempt > 0) {
                await new Promise((r) => setTimeout(r, 1000 * attempt));
              }
              u = await fetchUser();
              if (u) break;
            }
            if (u) {
              setUser(u);
              setIsLoading(false);
            }
          };

          pollTimer = setInterval(async () => {
            if (done) return;
            try {
              const pollRes = await authFetch(
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

          await Browser.addListener("browserFinished", async () => {
            if (done) return;
            // Stop the slow background poll — WebView is resuming now.
            if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
            // Aggressively poll now that the app is foregrounded again.
            let attempts = 0;
            const finalPoll = setInterval(async () => {
              attempts++;
              if (done || attempts > 20) { clearInterval(finalPoll); return; }
              try {
                const pollRes = await authFetch(
                  `/api/mobile-auth/poll?deviceCode=${encodeURIComponent(deviceCode)}`,
                  { credentials: "include" },
                );
                const data = (await pollRes.json()) as { ready: boolean; sid?: string };
                if (data.ready && data.sid) {
                  clearInterval(finalPoll);
                  await finish(data.sid);
                }
              } catch { /* keep trying */ }
            }, 800);
          });

          await Browser.open({ url: authorizationUrl });
        } catch {
          window.location.href = `${_apiBase}/api/login?returnTo=${encodeURIComponent(base)}`;
        }
      })();
      return;
    }

    const loginUrl = `${_apiBase}/api/login?returnTo=${encodeURIComponent(base)}&popup=1`;
    const popup = window.open(
      loginUrl,
      "lawnrx_auth",
      "width=520,height=720,popup=yes,left=200,top=80",
    );

    if (!popup) {
      window.location.href = `${_apiBase}/api/login?returnTo=${encodeURIComponent(base)}`;
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
    clearToken();
    window.location.href = `${_apiBase}/api/logout`;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
