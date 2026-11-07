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

export function shareTexts(origin: string, code: string): { en: string; ta: string; link: string } {
  const link = `${origin}/?ref=${encodeURIComponent(code)}`;
  return {
    link,
    en: `I use ViralAI by FARFAZ for my business ads — designs, campaigns and my own store in one place. Join free with my invite link: ${link}`,
    ta: `என் தொழில் விளம்பரங்களுக்கு நான் ViralAI by FARFAZ பயன்படுத்துகிறேன் — designs, பிரச்சாரங்கள், என் சொந்தக் கடை, எல்லாம் ஒரே இடத்தில். என் அழைப்பு இணைப்பில் இலவசமாகச் சேருங்கள்: ${link}`,
  };
}
