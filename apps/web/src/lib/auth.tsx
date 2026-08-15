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
  login: (phone: string, password: string) => Promise<User>;
  register: (payload: Record<string, unknown>) => Promise<User>;
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

  const login = useCallback(
    async (phone: string, password: string) =>
      accept(await api.post<AuthResult>("/auth/login", { phone, password }, null)),
    [accept],
  );

  const register = useCallback(
    async (payload: Record<string, unknown>) =>
      accept(await api.post<AuthResult>("/auth/register", { ...payload, locale }, null)),
    [accept, locale],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, register, logout }),
    [user, token, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
