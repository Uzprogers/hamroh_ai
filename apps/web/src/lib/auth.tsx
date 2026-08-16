import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import type { AuthResult, User } from "./types";
import { useI18n } from "../i18n/i18n";
import type { Locale } from "../i18n/dictionary";

const TOKEN_KEY = "hamroh.token";

interface AuthValue {
  user: User | null;
  token: string | null;
  ready: boolean;
  loginWithGoogle: (googleToken: string) => Promise<User>;
  accept: (result: AuthResult) => User;
  completeProfile: (payload: Record<string, unknown>) => Promise<User>;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const { locale, setLocale } = useI18n();

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }
    api
      .get<User>("/auth/me", token)
      .then((me) => {
        setUser(me);
        if (me.locale !== locale) setLocale(me.locale as Locale);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setReady(true));
  }, [token]);

  const accept = useCallback((result: AuthResult) => {
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const loginWithGoogle = useCallback(
    async (googleToken: string) =>
      accept(await api.post<AuthResult>("/auth/google", { token: googleToken, locale }, null)),
    [accept, locale],
  );

  const completeProfile = useCallback(
    async (payload: Record<string, unknown>) =>
      accept(await api.post<AuthResult>("/auth/profile", { ...payload, locale }, token)),
    [accept, locale, token],
  );

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setUser(await api.get<User>("/auth/me", token));
    } catch {
      return;
    }
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      loginWithGoogle,
      accept,
      completeProfile,
      refresh,
      logout,
    }),
    [user, token, ready, loginWithGoogle, accept, completeProfile, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
