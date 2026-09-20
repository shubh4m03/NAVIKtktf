/**
 * AuthBootstrapContext
 *
 * Provides invisible, zero-friction authentication for NAVIK.
 *
 * On mount, this context silently calls the backend login endpoint and caches
 * a valid JWT in localStorage.  The app remains renderable while bootstrap
 * runs so the public landing page does not depend on backend availability.
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '../services/api/client';

type BootstrapState = 'PENDING' | 'READY' | 'FAILED';

interface AuthBootstrapContextValue {
  state: BootstrapState;
  retry: () => void;
}

const AuthBootstrapContext = createContext<AuthBootstrapContextValue>({
  state: 'PENDING',
  retry: () => {},
});

export const useAuthBootstrap = () => useContext(AuthBootstrapContext);

interface AuthBootstrapProviderProps {
  children: ReactNode;
}

export function AuthBootstrapProvider({ children }: AuthBootstrapProviderProps) {
  const [state, setState] = useState<BootstrapState>('PENDING');

  const runBootstrap = async () => {
    setState('PENDING');

    // If we already have a valid-looking token, verify it quickly.
    const existing = localStorage.getItem('navik_auth_token');
    if (existing) {
      // Assume token is still valid (it refreshes automatically on 401).
      setState('READY');
      return;
    }

    // No token — run the invisible bootstrap.
    try {
      const token = await apiClient.bootstrap();
      if (token) {
        setState('READY');
      } else {
        setState('FAILED');
      }
    } catch {
      setState('FAILED');
    }
  };

  useEffect(() => {
    runBootstrap();
  }, []);

  return (
    <AuthBootstrapContext.Provider value={{ state, retry: runBootstrap }}>
      {children}
    </AuthBootstrapContext.Provider>
  );
}
