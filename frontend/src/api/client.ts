import { readJSON, writeJSON, localStorageAdapter } from "../storage/storage";

const TOKEN_KEY = "devle:token";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function getStoredToken(): string | null {
  return readJSON<string | null>(localStorageAdapter, TOKEN_KEY, null);
}

export function setStoredToken(token: string | null): void {
  if (token) writeJSON(localStorageAdapter, TOKEN_KEY, token);
  else localStorageAdapter.removeItem(TOKEN_KEY);
}

function apiBase(): string {
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  return configured?.replace(/\/$/, "") ?? "";
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${apiBase()}${path}`, { ...init, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  };

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload.error?.code ?? "REQUEST_FAILED",
      payload.error?.message ?? `Request failed (${response.status})`,
    );
  }

  return payload as T;
}
