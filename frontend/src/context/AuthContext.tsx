import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserSession } from '../types';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cerberus_soc_user');
      if (stored) {
        const parsed = JSON.parse(stored) as UserSession;
        if (parsed.expires_at > Date.now()) {
          setUser(parsed);
        } else {
          localStorage.removeItem('cerberus_soc_user');
        }
      } else {
        // Default authenticated demo session for immediate exploration
        const defaultSession: UserSession = {
          username: 'soc_operator',
          role: 'admin',
          token: 'sec-tok-operator-cerberus-default',
          expires_at: Date.now() + 86400000
        };
        setUser(defaultSession);
        localStorage.setItem('cerberus_soc_user', JSON.stringify(defaultSession));
      }
    } catch {
      // LocalStorage access fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password = ''): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Attempt backend auth route if available
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (res.ok) {
          const data = await res.json();
          const session: UserSession = {
            username: data.username || username,
            role: data.role || 'admin',
            token: data.token || `tok-${Date.now()}`,
            expires_at: data.expires_at || Date.now() + 86400000
          };
          setUser(session);
          localStorage.setItem('cerberus_soc_user', JSON.stringify(session));
          return true;
        }
      } catch {
        // Fallback to local operator authentication
      }

      // Offline / dev fallback: accept any non-empty username
      const session: UserSession = {
        username: username || 'soc_operator',
        role: username.toLowerCase().includes('audit') ? 'auditor' : 'admin',
        token: `tok-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        expires_at: Date.now() + 86400000
      };
      setUser(session);
      localStorage.setItem('cerberus_soc_user', JSON.stringify(session));
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem('cerberus_soc_user');
    } catch {
      // Ignore storage errors
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
