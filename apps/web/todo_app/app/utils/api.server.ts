const API_URL = process.env.API_URL ?? 'http://localhost:3001';

// Render free-tier services spin down after inactivity and return 502/503
// while waking up. Retry those (and transient network failures) with a
// short backoff before giving up.
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const MAX_RETRIES = 2; // total attempts = 1 + MAX_RETRIES
const BACKOFF_MS = [3000, 5000]; // wait before retry 1, retry 2

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, init);

      // Only retry idempotent-ish gateway failures; return everything else
      // (including 4xx and 500) to the caller immediately.
      if (!RETRYABLE_STATUSES.has(res.status)) {
        return res;
      }
      lastError = new Error(`Upstream returned ${res.status}`);
    } catch (err) {
      // Network-level failure (ECONNREFUSED, DNS, socket reset, ...)
      lastError = err;
    }

    if (attempt < MAX_RETRIES) {
      await sleep(BACKOFF_MS[attempt] ?? 5000);
    }
  }

  // API is genuinely unreachable. Throw a Response so route ErrorBoundaries
  // can detect it via isRouteErrorResponse(error) && error.status === 503.
  console.error('API unreachable after retries:', lastError);
  throw new Response('The server is waking up or temporarily unavailable.', {
    status: 503,
    statusText: 'API Unavailable',
  });
}

export async function apiFetch(
  path: string,
  token: string,
  options: RequestInit = {},
) {
  const res = await fetchWithRetry(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    throw new Response('Unauthorized', { status: 401 });
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? `API error: ${res.status}`);
  }

  return res.json();
}

export async function apiLogin(email: string, password: string) {
  const res = await fetchWithRetry(`${API_URL}/auth/login`, {
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