"use client";

// Tiny client helpers shared by all app screens.
export async function api(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || data.ok === false) {
    const err = new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
    (err as Error & { data?: unknown }).data = data;
    // Report client-visible failures to the Error Inbox (best effort).
    fetch("/api/errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: `client:${path}`, message: err.message }),
    }).catch(() => {});
    throw err;
  }
  return data;
}

export function money(minor: number, currency = "INR"): string {
  const sym = currency === "INR" ? "₹" : currency + " ";
  return `${sym}${(minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function clientKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type Lang = "en" | "ta";
export const LANG_KEY = "viralai_lang";

export function loadLang(): Lang {
  try {
    return (localStorage.getItem(LANG_KEY) as Lang) || "en";
  } catch {
    return "en";
  }
}
export function saveLang(l: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    /* private mode */
  }
}

// shareTexts lives in ./share (server-safe) and is re-exported here so
// existing client imports keep working; server routes import it from
// "@/lib/share" directly — calling it from this "use client" module
// would throw at runtime in a route handler.
export { shareTexts } from "./share";
