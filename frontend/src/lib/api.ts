/**
 * Shared API Client
 *
 * Central HTTP client for all frontend ↔ backend communication.
 * Unwraps the backend response envelope: { success, data, meta }
 * 
 * Includes JWT auto-refresh logic:
 * - If 401 response received, attempts to refresh token
 * - On successful refresh, retries original request
 * - If refresh fails, user is sent to login page
 */

import { getIdentityHeaders } from "@/lib/session";

// ── Config ──

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
const LAST_NON_ERROR_ROUTE_KEY = "dc_last_non_error_route";

function isErrorRoutePath(pathname: string): boolean {
  return [
    "/401",
    "/403",
    "/404",
    "/500",
    "/503",
    "/unauthorized",
    "/forbidden",
    "/not-found",
    "/server-error",
    "/service-unavailable",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function rememberLastNonErrorRoute(): void {
  const { pathname, search, hash } = window.location;
  if (isErrorRoutePath(pathname)) {
    return;
  }

  sessionStorage.setItem(
    LAST_NON_ERROR_ROUTE_KEY,
    `${pathname}${search}${hash}`,
  );
}

export function consumeLastNonErrorRoute(): string | null {
  const route = sessionStorage.getItem(LAST_NON_ERROR_ROUTE_KEY);
  if (route) {
    sessionStorage.removeItem(LAST_NON_ERROR_ROUTE_KEY);
  }
  return route;
}

function resolveApiBaseUrl(): string {
  const fallbackUrl = "http://localhost:8000/api";
  const configuredUrl = (import.meta.env.VITE_API_URL ?? fallbackUrl).trim();

  try {
    const parsedUrl = new URL(configuredUrl);
    const isHttpsPage = window.location.protocol === "https:";
    const isLocalHost =
      parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";

    // Prevent mixed-content errors when production env vars use an HTTP origin.
    if (isHttpsPage && parsedUrl.protocol === "http:" && !isLocalHost) {
      parsedUrl.protocol = "https:";
    }

    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return fallbackUrl;
  }
}

const API_BASE = resolveApiBaseUrl();

/**
 * Attempt to refresh JWT access token using refresh token
 * @returns true on success, false on failure
 */
async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send cookies
      });

      if (res.ok) {
        isRefreshing = false;
        refreshPromise = null;
        return true;
      } else {
        // Refresh failed — redirect to login
        window.location.assign("/login");
        return false;
      }
    } catch {
      // Network error — redirect to login
      window.location.assign("/login");
      return false;
    }
  })();

  return refreshPromise;
}

function routeForServerStatus(status: number): string | null {
  if (status === 401) return "/401";
  if (status === 403) return "/403";
  if (status === 404) return "/404";
  if (status === 502 || status === 504) return "/service-unavailable?reason=restarting";
  if (status === 503) return "/503";
  if (status >= 500) return "/500";
  return null;
}

export function redirectForServerStatus(status: number): void {
  const targetPath = routeForServerStatus(status);
  if (!targetPath || window.location.pathname === targetPath) {
    return;
  }

  rememberLastNonErrorRoute();
  window.location.assign(targetPath);
}

// ── Response Types ──

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
  };
}

export class ApiRequestError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
  }
}

// ── Core Fetch ──

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<{ data: T; meta?: ApiResponse<T>["meta"] }> {
  const url = `${API_BASE}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      credentials: "include", // Send/receive cookies (JWT tokens)
      headers: {
        "Content-Type": "application/json",
        ...getIdentityHeaders(),
        ...options.headers,
      },
    });
  } catch {
    // Render free-tier cold starts often surface as network-level fetch failures.
    if (window.location.pathname !== "/service-unavailable") {
      rememberLastNonErrorRoute();
      window.location.assign("/service-unavailable?reason=restarting");
    }
    throw new ApiRequestError(
      "SERVER_RESTARTING",
      "Server is restarting. Please wait a moment and try again.",
      503,
    );
  }

  let body: Partial<ApiResponse<T>> & { error?: ApiError["error"] } = {};
  try {
    body = await res.json();
  } catch {
    // Non-JSON responses still need server-status routing.
  }

  // Handle 401 Unauthorized — attempt token refresh
  if (res.status === 401 && retryCount === 0) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the original request with new token
      return request<T>(endpoint, options, 1);
    }
    // If refresh failed, fall through to error handling below
  }

  if (!res.ok || !body.success) {
    redirectForServerStatus(res.status);

    const err = body.error ?? {
      code: "UNKNOWN",
      message: res.statusText,
      status: res.status,
    };

    redirectForServerStatus(err.status ?? res.status);

    throw new ApiRequestError(err.code, err.message, err.status ?? res.status);
  }

  return { data: body.data as T, meta: body.meta };
}

// ── Public Helpers ──

/** GET request — returns unwrapped data */
export async function get<T>(endpoint: string): Promise<T> {
  const { data } = await request<T>(endpoint);
  return data;
}

/** GET request — returns data + pagination meta */
export async function getWithMeta<T>(
  endpoint: string,
): Promise<{ data: T; meta?: ApiResponse<T>["meta"] }> {
  return request<T>(endpoint);
}

/** POST request */
export async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const { data } = await request<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
  return data;
}

/** PUT request */
export async function put<T>(endpoint: string, body?: unknown): Promise<T> {
  const { data } = await request<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
  return data;
}

/** DELETE request */
export async function del<T = void>(endpoint: string): Promise<T> {
  const { data } = await request<T>(endpoint, { method: "DELETE" });
  return data;
}

/** PATCH request */
export async function patch<T>(endpoint: string, body?: unknown): Promise<T> {
  const { data } = await request<T>(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
  return data;
}

/** Build query string from params object (skips null/undefined) */
export function qs(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  );
}

export { API_BASE };
