/**
 * Shared API Client
 *
 * Central HTTP client for all frontend ↔ backend communication.
 * Unwraps the backend response envelope: { success, data, meta }
 *
 * Headers:
 *   x-company-id  — Tenant scoping (required for most endpoints)
 *   x-driver-id   — Driver identity (future: JWT)
 */

// ── Config ──

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

/**
 * Dev-mode identity headers.
 * In production these will come from auth context / JWT.
 * Values are set during login via the account-based auth flow.
 */
function getIdentityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  const companyId = localStorage.getItem("dc_company_id");
  const driverId = localStorage.getItem("dc_driver_id");

  if (companyId) headers["x-company-id"] = companyId;
  if (driverId) headers["x-driver-id"] = driverId;

  return headers;
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
): Promise<{ data: T; meta?: ApiResponse<T>["meta"] }> {
  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getIdentityHeaders(),
      ...options.headers,
    },
  });

  const body = await res.json();

  if (!res.ok || !body.success) {
    const err = body.error ?? {
      code: "UNKNOWN",
      message: res.statusText,
      status: res.status,
    };
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
