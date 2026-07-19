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

// ── TOKEN STORAGE ────────────────────────────────────────────────────────
// Stored in memory + localStorage so the user stays logged in on refresh.

export function saveToken(token) {
  localStorage.setItem("cmx_token", token);
}

export function getToken() {
  return localStorage.getItem("cmx_token");
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
    // Backend sends { message: "..." } or { errors: [...] } on failure
    const message =
      data?.message ||
      data?.errors?.[0]?.msg ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}