'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, setAccessToken, setOnUnauthorized } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface AuthResponse {
  user: User;
  accessToken: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Bootstrap: try refresh + /me on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.post<AuthResponse>('/auth/refresh');
        if (cancelled) return;
        setAccessToken(r.accessToken);
        setUser(r.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Wire up global 401 → boot to login
  useEffect(() => {
    setOnUnauthorized(() => {
      setAccessToken(null);
      setUser(null);
      router.replace('/login');
    });
    return () => setOnUnauthorized(null);
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post<AuthResponse>('/auth/login', { email, password });
    setAccessToken(r.accessToken);
    setUser(r.user);
  }, []);

  const demoLogin = useCallback(async () => {
    const r = await api.post<AuthResponse>('/auth/demo-login');
    setAccessToken(r.accessToken);
    setUser(r.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const r = await api.post<AuthResponse>('/auth/signup', { name, email, password });
    setAccessToken(r.accessToken);
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
    router.replace('/login');
  }, [router]);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, demoLogin, signup, logout }),
    [user, loading, login, demoLogin, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
