const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
  }
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { authorization: `Bearer ${token}` } : {};
}

async function handle<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  }

  let code = "unknown";
  try {
    const body = (await response.json()) as { message?: string | string[] };
    code = Array.isArray(body.message) ? body.message[0] : (body.message ?? "unknown");
  } catch {
    code = "unknown";
  }
  throw new ApiError(code, response.status);
}

export const api = {
  async get<T>(path: string, token: string | null): Promise<T> {
    const response = await fetch(`${BASE_URL}/api${path}`, { headers: authHeaders(token) });
    return handle<T>(response);
  },

  async post<T>(path: string, body: unknown, token: string | null): Promise<T> {
    const response = await fetch(`${BASE_URL}/api${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(body),
    });
    return handle<T>(response);
  },

  async patch<T>(path: string, body: unknown, token: string | null): Promise<T> {
    const response = await fetch(`${BASE_URL}/api${path}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(body),
    });
    return handle<T>(response);
  },

  async del<T>(path: string, token: string | null): Promise<T> {
    const response = await fetch(`${BASE_URL}/api${path}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return handle<T>(response);
  },
};

export const API_BASE_URL = BASE_URL;
