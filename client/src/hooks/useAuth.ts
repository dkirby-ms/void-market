import { useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "vm_access_token";
const REFRESH_KEY = "vm_refresh_token";

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/auth";

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

export interface UseAuth {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<{ data?: unknown; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return { error: (body as { error?: string }).error ?? "Request failed" };
    }
    return { data: body };
  } catch {
    return { error: "Network error — unable to reach server" };
  }
}

interface DevTokenResponse {
  token: string;
  user: { id: string; username: string };
}

/**
 * Attempt to auto-login via the dev-token endpoint (dev mode only).
 * Returns the token and user on success, or null if unavailable.
 */
async function tryDevAutoLogin(): Promise<DevTokenResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/dev-token`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Record<string, unknown>;
    const user = body.user as { id?: string; username?: string } | undefined;
    if (typeof body.token === "string" && user?.id && user.username) {
      return { token: body.token, user: { id: user.id, username: user.username } };
    }
    return null;
  } catch {
    return null;
  }
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface MeResponse {
  user: AuthUser;
}

export function useAuth(): UseAuth {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    !!localStorage.getItem(TOKEN_KEY) || import.meta.env.DEV,
  );
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    setToken(accessToken);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Validate stored token on mount (or auto-login in dev mode)
  useEffect(() => {
    void (async () => {
      // In dev mode, try the dev-token endpoint to skip the login screen
      if (import.meta.env.DEV) {
        const devResult = await tryDevAutoLogin();
        if (devResult) {
          persist(devResult.token, "dev-refresh-placeholder");
          setUser(devResult.user);
          setIsLoading(false);
          return;
        }
        // Dev-token failed — fall through to normal flow
      }

      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }

      const meResult = await apiFetch("/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${stored}`,
        },
      });

      const meData = meResult.data as MeResponse | undefined;
      if (meData?.user) {
        setUser(meData.user);
      } else {
        // Token expired or invalid — try refresh
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (refreshToken) {
          const refreshResult = await apiFetch("/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          });
          const refreshData = refreshResult.data as
            | { accessToken: string }
            | undefined;
          if (refreshData?.accessToken) {
            localStorage.setItem(TOKEN_KEY, refreshData.accessToken);
            setToken(refreshData.accessToken);
            // Re-check with new token
            const recheck = await apiFetch("/me", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${refreshData.accessToken}`,
              },
            });
            const recheckData = recheck.data as MeResponse | undefined;
            if (recheckData?.user) {
              setUser(recheckData.user);
            } else {
              clear();
            }
          } else {
            clear();
          }
        } else {
          clear();
        }
      }
      setIsLoading(false);
    })();
  }, [clear, persist]);

  const login = useCallback(
    async (username: string, password: string) => {
      setError(null);
      setIsLoading(true);
      const result = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const data = result.data as AuthResponse | undefined;
      if (data) {
        persist(data.accessToken, data.refreshToken);
        setUser(data.user);
      } else {
        setError(result.error ?? "Login failed");
      }
      setIsLoading(false);
    },
    [persist],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      setError(null);
      setIsLoading(true);
      const result = await apiFetch("/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });
      const data = result.data as AuthResponse | undefined;
      if (data) {
        persist(data.accessToken, data.refreshToken);
        setUser(data.user);
      } else {
        setError(result.error ?? "Registration failed");
      }
      setIsLoading(false);
    },
    [persist],
  );

  const logout = useCallback(() => {
    clear();
    setError(null);
  }, [clear]);

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    register,
    logout,
  };
}
