/**
 * AuthBootstrapContext
 *
 * Provides invisible, zero-friction authentication for NAVIK.
 *
 * On mount, this context silently calls the backend login endpoint and caches
 * a valid JWT in localStorage.  Child components are rendered only after the
 * bootstrap completes (or fails gracefully).  No credential input from the
 * user is ever required or shown.
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
      {state === 'PENDING' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#020817',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          {/* Minimal, brand-consistent loading indicator */}
          <div style={{ textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '2px solid rgba(0, 212, 255, 0.2)',
                borderTop: '2px solid #00d4ff',
                margin: '0 auto 16px',
                animation: 'spin 0.9s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#38bdf8', fontSize: 13, letterSpacing: '0.1em', opacity: 0.8 }}>
              INITIALISING
            </p>
          </div>
        </div>
      )}

      {state === 'FAILED' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#020817',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            flexDirection: 'column',
            gap: 16,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          <p style={{ color: '#f87171', fontSize: 15 }}>
            NAVIK backend is unavailable. Check that all services are running.
          </p>
          <button
            onClick={runBootstrap}
            style={{
              padding: '10px 24px',
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              borderRadius: 8,
              color: '#00d4ff',
              cursor: 'pointer',
              fontSize: 13,
              letterSpacing: '0.05em',
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {state === 'READY' && children}
    </AuthBootstrapContext.Provider>
  );
}
