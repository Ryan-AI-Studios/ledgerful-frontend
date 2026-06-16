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

export function buildApiUrl(
  path: string,
  params?: Record<string, string | undefined>,
): string {
  const token = getAuthToken();
  const search = new URLSearchParams();
  if (token) search.set("token", token);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
  }

  const query = search.toString();
  // Default to the local daemon URL so the static export can reach the backend
  // without relying on Next.js rewrites (which do not apply to `output: "export"`).
  // Override with NEXT_PUBLIC_LEDGERFUL_API_URL for a different host or proxy.
  const base =
    process.env.NEXT_PUBLIC_LEDGERFUL_API_URL ?? "http://127.0.0.1:52001";
  const prefix = base.replace(/\/$/, "");
  return `${prefix}/api${path}${query ? `?${query}` : ""}`;
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  // Fallback for future dates or very old dates
  if (diffInSeconds < 0) return "in the future";
  
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  if (diffInSeconds < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
  return rtf.format(-Math.floor(diffInSeconds / 31536000), "year");
}

export function formatTimeAgo(date: Date | string): string {
  return formatRelativeTime(date);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
