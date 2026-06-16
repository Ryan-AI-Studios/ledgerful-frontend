import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TOKEN_KEY = "ledgerful:token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.sessionStorage.getItem(TOKEN_KEY);
    if (stored) return stored;
  } catch {
    // sessionStorage may be unavailable in private mode.
  }

  const fromUrl = new URLSearchParams(window.location.search).get("token");
  if (fromUrl) {
    try {
      window.sessionStorage.setItem(TOKEN_KEY, fromUrl);
    } catch {
      // ignore storage errors.
    }
    return fromUrl;
  }

  return null;
}

export function buildApiUrl(path: string, params?: Record<string, string>): string {
  const token = getAuthToken();
  const search = new URLSearchParams();
  if (token) search.set("token", token);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
  }
  const query = search.toString();
  return `/api${path}${query ? `?${query}` : ""}`;
}

