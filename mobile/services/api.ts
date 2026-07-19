/**
 * services/api.ts
 *
 * Base HTTP client for the Njangui FastAPI backend.
 *
 * • Reads the base URL from EXPO_PUBLIC_API_URL (set in .env)
 * • Attaches the stored Bearer token on every request
 * • Throws ApiError with { status, message } on non-2xx responses
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Config ──────────────────────────────────────────────────────────────────
// In development: http://192.168.x.x:8000   (replace with your machine IP)
// In production:  https://api.njangui.cm
//
// EXPO_PUBLIC_* vars are baked in at Metro bundler startup, so a release
// build with a missing/blank var would otherwise silently point at nothing —
// fail loudly at load time instead of shipping a build that can't reach the
// backend. In dev, fall back to a LAN default so `expo start` still works
// without a .env.local, but warn so it isn't a silent surprise.
const DEV_FALLBACK_API_URL = "http://192.168.1.100:8000";

function resolveApiBase(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured;

  if (__DEV__) {
    console.warn(
      `[api] EXPO_PUBLIC_API_URL is not set — falling back to ${DEV_FALLBACK_API_URL}. ` +
        "Set it in mobile/.env.local to point at your backend.",
    );
    return DEV_FALLBACK_API_URL;
  }

  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Configure it at build time before shipping a release build.",
  );
}

export const API_BASE = resolveApiBase();

export const TOKEN_KEY = "njangui_access_token";

// ── Custom error ─────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail ?? body.message ?? message;
    } catch {
      // leave default message
    }
    throw new ApiError(response.status, message);
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as unknown as T;

  return response.json() as Promise<T>;
}

// ── Convenience methods ───────────────────────────────────────────────────────
export const api = {
  get<T>(path: string, authenticated = true) {
    return request<T>(path, { method: "GET" }, authenticated);
  },
  post<T>(path: string, body: unknown, authenticated = true) {
    return request<T>(
      path,
      { method: "POST", body: JSON.stringify(body) },
      authenticated,
    );
  },
  patch<T>(path: string, body: unknown, authenticated = true) {
    return request<T>(
      path,
      { method: "PATCH", body: JSON.stringify(body) },
      authenticated,
    );
  },
  del<T>(path: string, authenticated = true) {
    return request<T>(path, { method: "DELETE" }, authenticated);
  },
};
