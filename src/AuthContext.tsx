import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setAuthToken, SESSION_EXPIRED_EVENT } from './api';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // api.ts dispara este evento cuando el backend responde 401 (sesion
  // perdida o expirada): se vuelve a la pantalla de login.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  async function loginWithGoogle(idToken: string) {
    const data = await api.loginWithGoogle(idToken);
    setAuthToken(data.token || null);
    setUser(data.user);
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  }

  const isAdmin = user?.role === 'administrador';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
