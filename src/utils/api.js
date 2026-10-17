/**
 * api.js
 * ------
 * Shared fetch helper used by every component that talks to the backend.
 * Automatically attaches the JWT token (if one exists) and handles errors
 * consistently, so components don't repeat this logic.
 *
 * Usage:
 *   import { apiRequest, saveToken, getToken, clearToken } from "../utils/api";
 *
 *   const data = await apiRequest("/api/auth/login", {
 *     method: "POST",
 *     body: { username, password },
 *   });
 */

const BASE_URL = import.meta.env.VITE_API_URL || "https://codementorx-backend.onrender.com";

// ── TOKEN STORAGE & EXPIRATION ───────────────────────────────────────────
// Stored in localStorage with automatic expiration checking (3 days default).

export function parseJwt(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  if (!token) return true;
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  // exp is in seconds, compare with Date.now() in ms
  return decoded.exp * 1000 <= Date.now();
}

export function saveToken(token) {
  if (!token) return;
  localStorage.setItem("cmx_token", token);
}

export function getToken() {
  const token = localStorage.getItem("cmx_token");
  if (!token) return null;
  if (isTokenExpired(token)) {
    clearToken();
    return null;
  }
  return token;
}

export function clearToken() {
  localStorage.removeItem("cmx_token");
}

// ── CORE REQUEST FUNCTION ────────────────────────────────────────────────

export async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cmx_auth_expired", { detail: { path } }));
      }
    }

    // Backend sends { message: "..." } or { errors: [...] } on failure
    const message =
      data?.message ||
      data?.errors?.[0]?.msg ||
      `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}