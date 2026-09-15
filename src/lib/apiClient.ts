/**
 * Frontend Secure API Client for OpenWork.
 * Automatically injects Anti-CSRF token headers and manages credentialed requests.
 */

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  // 1. Automatically attach Anti-CSRF token on state-changing mutating requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = getCookie('__Host-csrf_token') || localStorage.getItem('openwork_csrf_token');
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  headers.set('Accept', 'application/json');

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // Ensures HttpOnly cookies are transmitted securely
  };

  const response = await fetch(url, config);

  // 2. Automatic redirect on 401 Unauthorized for authenticated endpoints
  if (response.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/verify')) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      localStorage.removeItem('openwork_auth_session');
      window.location.href = '/login';
    }
  }

  return response;
}
