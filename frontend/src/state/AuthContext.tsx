import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import { ApiError, getStoredToken, setStoredToken } from "../api/client";
import type { PublicUser } from "../api/types";
import { migrateLocalProgress } from "../api/users";
import { devleStorage } from "../storage/persistence";

interface AuthValue {
  ready: boolean;
  user: PublicUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

async function migrateIfNeeded() {
  const payload = devleStorage.getLocalProgressPayload();
  if (!payload) return;
  try {
    await migrateLocalProgress(payload);
  } catch {
    // Best-effort — a failed import must not block sign-in.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setReady(true);
      return;
    }

    authApi
      .getMe()
      .then((res) => setUser(res.user))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          setStoredToken(null);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setStoredToken(res.token);
    setUser(res.user);
    await migrateIfNeeded();
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    setStoredToken(res.token);
    setUser(res.user);
    await migrateIfNeeded();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Token discard on the client is what actually logs out.
    }
    setStoredToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ ready, user, login, register, logout }),
    [ready, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
