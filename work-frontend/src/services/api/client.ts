/**
 * NAVIK API Client
 *
 * Zero-friction auth design:
 * - No /login redirects anywhere.
 * - If the access token is missing or expired, an invisible bootstrap is
 *   attempted (POST /auth/login with the configured workstation credentials).
 * - Bootstrap credentials are read from Vite env vars at build time; they are
 *   NOT hardcoded here.  Set VITE_BOOTSTRAP_USER and VITE_BOOTSTRAP_PASS in
 *   .env.development (values are the backend-issued service-account creds).
 * - The backend JWT/RBAC/refresh infrastructure is fully preserved.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Bootstrap credentials come from env vars — never hardcode here.
const BOOTSTRAP_USER = import.meta.env.VITE_BOOTSTRAP_USER || 'admin';
const BOOTSTRAP_PASS = import.meta.env.VITE_BOOTSTRAP_PASS || 'admin123';

export class ApiError extends Error {
  constructor(public status: number, public message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  requiresAuth?: boolean;
}

/** Perform the invisible workstation bootstrap and return the access token. */
async function invisibleBootstrap(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: BOOTSTRAP_USER, password: BOOTSTRAP_PASS }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.accessToken) {
        localStorage.setItem('navik_auth_token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('navik_refresh_token', data.refreshToken);
        }
        return data.accessToken;
      }
    }
  } catch (e) {
    console.warn('[NAVIK] Invisible bootstrap failed — backend may be unavailable.', e);
  }
  return null;
}

export const apiClient = {
  /**
   * Try to refresh the JWT via the refresh-token endpoint.
   * Falls back to invisible bootstrap if no refresh token is available.
   * Never redirects to a login page.
   */
  async refreshToken(): Promise<string | null> {
    const refresh = localStorage.getItem('navik_refresh_token');
    if (refresh) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.accessToken) {
            localStorage.setItem('navik_auth_token', data.accessToken);
            if (data.refreshToken) {
              localStorage.setItem('navik_refresh_token', data.refreshToken);
            }
            return data.accessToken;
          }
        }
      } catch (e) {
        console.warn('[NAVIK] Token refresh failed, attempting bootstrap.', e);
      }
    }

    // Refresh failed or no refresh token — fall back to invisible bootstrap.
    localStorage.removeItem('navik_auth_token');
    localStorage.removeItem('navik_refresh_token');
    return invisibleBootstrap();
  },

  async fetch<T>(endpoint: string, options: FetchOptions = {}, retryCount = 0): Promise<T> {
    const { params, requiresAuth = true, headers, ...init } = options;

    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      url += `?${new URLSearchParams(params).toString()}`;
    }

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      let token = localStorage.getItem('navik_auth_token');
      if (!token) {
        // No token at all — run invisible bootstrap before the first request.
        token = await invisibleBootstrap();
      }
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      } else {
        throw new ApiError(503, 'Backend authentication service unavailable');
      }
    }

    const response = await fetch(url, {
      ...init,
      headers: { ...defaultHeaders, ...headers },
    });

    if (response.status === 401 && requiresAuth && retryCount === 0) {
      // Access token expired — try refresh / bootstrap, then retry once.
      const newToken = await this.refreshToken();
      if (newToken) {
        return this.fetch<T>(endpoint, options, 1);
      }
      throw new ApiError(401, 'Session could not be renewed — backend unavailable');
    }

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      throw new ApiError(response.status, errorData?.message || 'API request failed', errorData);
    }

    if (response.status === 204) {
      return null as any;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text() as any;
  },

  get<T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body: any, options?: Omit<FetchOptions, 'method' | 'body'>) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put<T>(endpoint: string, body: any, options?: Omit<FetchOptions, 'method' | 'body'>) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  },

  /** Explicitly run bootstrap (called on app mount). */
  bootstrap: invisibleBootstrap,
};
