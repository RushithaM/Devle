/**
 * Thin abstraction over key-value storage so UI code never touches
 * `localStorage` (or any other backing store) directly.
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Wraps window.localStorage, swallowing errors from private-browsing / quota limits. */
export const localStorageAdapter: StorageAdapter = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (private mode, quota exceeded, etc.) — fail silently.
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // no-op
    }
  },
};

export function readJSON<T>(
  adapter: StorageAdapter,
  key: string,
  fallback: T,
): T {
  const raw = adapter.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(
  adapter: StorageAdapter,
  key: string,
  value: T,
): void {
  adapter.setItem(key, JSON.stringify(value));
}
