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

/** GET tanasiz ketadi, qolganlari JSON tanasi bilan — barcha so'rovlar uchun yagona nuqta. */
async function request<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  token: string | null,
  body?: unknown,
): Promise<T> {
  const init: RequestInit =
    method === "GET"
      ? { headers: authHeaders(token) }
      : {
          method,
          headers: { "content-type": "application/json", ...authHeaders(token) },
          body: JSON.stringify(body),
        };

  return handle<T>(await fetch(`${BASE_URL}/api${path}`, init));
}

export const api = {
  get<T>(path: string, token: string | null): Promise<T> {
    return request<T>("GET", path, token);
  },

  post<T>(path: string, body: unknown, token: string | null): Promise<T> {
    return request<T>("POST", path, token, body);
  },

  patch<T>(path: string, body: unknown, token: string | null): Promise<T> {
    return request<T>("PATCH", path, token, body);
  },
};

export const API_BASE_URL = BASE_URL;
