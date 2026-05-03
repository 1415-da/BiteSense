import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  apiRequest,
  clearStoredTokens,
  fetchMe,
  getStoredTokens,
  googleLoginRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  setStoredTokens,
  tryRefreshAccessToken,
} from './api';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  googleClientId: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleClientId = import.meta.env.VITE_GOOGLE_OAUTH_WEB_CLIENT_ID ?? '';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const { access, refresh } = getStoredTokens();
    if (!refresh && !access) {
      setLoading(false);
      return;
    }

    if (!access && refresh) {
      const ok = await tryRefreshAccessToken();
      if (!ok) {
        clearStoredTokens();
        setLoading(false);
        return;
      }
    }

    let res = await apiRequest('/api/v1/auth/me', { method: 'GET', skipRefresh: true });
    if (res.status === 401 && getStoredTokens().refresh) {
      const ok = await tryRefreshAccessToken();
      if (ok) {
        res = await apiRequest('/api/v1/auth/me', { method: 'GET', skipRefresh: true });
      }
    }

    if (res.ok) {
      setUser((await res.json()) as AuthUser);
    } else {
      clearStoredTokens();
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await loginRequest(email, password);
    setStoredTokens(tokens.access_token, tokens.refresh_token);
    const me = await fetchMe();
    setUser(me);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const tokens = await registerRequest(email, password, fullName);
    setStoredTokens(tokens.access_token, tokens.refresh_token);
    const me = await fetchMe();
    setUser(me);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const tokens = await googleLoginRequest(idToken);
    setStoredTokens(tokens.access_token, tokens.refresh_token);
    const me = await fetchMe();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    clearStoredTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      googleClientId,
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [user, loading, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
