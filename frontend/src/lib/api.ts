import { QueryKey, UseMutationOptions, UseQueryOptions, useMutation, useQuery } from '@tanstack/react-query';

export const BASE_URL: string = import.meta.env.VITE_API_URL;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

// Token management
const tokens = {
  get: () => ({
    id: localStorage.getItem('id_token'),
    refresh: localStorage.getItem('refresh_token')
  }),
  set: (idToken: string, refreshToken: string) => {
    localStorage.setItem('id_token', idToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clear: () => {
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
  }
};

// Prevent concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return await refreshPromise;

  const { refresh } = tokens.get();
  if (!refresh) {
    tokens.clear();
    return false;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/tokens`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh })
      });

      if (!response.ok) throw new Error('Refresh failed');

      const { data } = await response.json();
      if (data?.idToken && data?.refreshToken) {
        tokens.set(data.idToken, data.refreshToken);
        return true;
      }
      
      throw new Error('Invalid response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      tokens.clear();
      window.location.href = '/login?error=session_expired';
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request<T = unknown>(
  endpoint: string,
  method: HttpMethod,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...opts } = options;

  const makeRequest = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      ...(opts.headers as Record<string, string>)
    };

    // Only set Content-Type to application/json if body is not FormData
    if (opts.body && !(opts.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (!skipAuth) {
      const { id } = tokens.get();
      if (id) headers.Authorization = `Bearer ${id}`;
    }

    return fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      ...opts,
      body: opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)
        ? JSON.stringify(opts.body)
        : opts.body
    });
  };

  let response = await makeRequest();

  // Auto-refresh on 401
  if (response.status === 401 && !skipAuth && tokens.get().refresh) {
    if (await refreshTokens()) {
      response = await makeRequest();
    }
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch {
      // Failed to parse error response, use status text
    }

    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  const contentType = response.headers.get('content-type');
  return contentType?.includes('application/json')
    ? await response.json()
    : await response.text() as unknown as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, 'GET', options),
  
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'POST', { ...options, body: body as BodyInit }),
  
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'PUT', { ...options, body: body as BodyInit }),
  
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'PATCH', { ...options, body: body as BodyInit }),
  
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, 'DELETE', options)
};

export const auth = {
  isAuthenticated: () => !!tokens.get().id,
  
  getUser: () => {
    const { id } = tokens.get();
    if (!id) return null;
    
    try {
      const payload = JSON.parse(atob(id.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };
    } catch {
      return null;
    }
  },
  
  logout: () => {
    tokens.clear();
    window.location.href = '/login';
  }
};

export function useApiQuery<T = unknown, E = Error>(
  key: QueryKey,
  endpoint: string,
  options?: Omit<UseQueryOptions<T, E>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, E>({
    queryKey: key,
    queryFn: () => api.get<T>(endpoint),
    retry: (failureCount, error: E & { status?: number }) => 
      error?.status === 401 || error?.status === 403 ? false : failureCount < 3,
    ...options
  });
}

export function useApiMutation<T = unknown, V = unknown, E = Error>(
  method: Exclude<HttpMethod, 'GET'>,
  endpoint: string,
  options?: Omit<UseMutationOptions<T, E, V>, 'mutationFn'>
) {
  return useMutation<T, E, V>({
    mutationFn: (variables: V) =>
      request<T>(endpoint, method, { body: variables as BodyInit }),
    ...options
  });
}