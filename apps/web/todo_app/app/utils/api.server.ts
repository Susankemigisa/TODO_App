const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function apiFetch(
  path: string,
  token: string,
  options: RequestInit = {},
) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? `API error: ${res.status}`);
  }

  return res.json();
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error('Invalid credentials');
  return res.json() as Promise<{
    access_token: string;
    user: { id: string; email: string; name: string; avatar: string | null };
  }>;
}