export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const baseUrl = API_BASE_URL;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}/admin${url}`, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    throw new Error('Unauthorized');
  }

  return res;
};

export const fetchPublic = async (url: string, options: RequestInit = {}) => {
  const baseUrl = API_BASE_URL;
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });

  return res;
};

export const fetchCustomerAuth = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const baseUrl = API_BASE_URL;

  // If no token exists at all, throw without redirecting — the calling page decides what to do
  if (!token) {
    throw new Error('Unauthorized');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw new Error('Session Expired');
  }

  return res;
};
