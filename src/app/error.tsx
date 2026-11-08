"use client";
import React, { useEffect, useState } from "react";
import { loadLang } from "@/lib/client";

/** Root error boundary (the app had NONE). A render throw on a page used
 *  to kill the client navigation silently — the tap appeared to do
 *  nothing and the previous page stayed on screen (the Plans / Strategy /
 *  Owner stall, Nov 2026). Now any unexpected render failure shows this
 *  bilingual recovery card with a working retry, on every route. */
export default function AppError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  const [ta, setTa] = useState(false);
  useEffect(() => {
    setTa(loadLang() === "ta");
    // Keep the failure visible in the console for diagnosis; the Error
    // Inbox reporting in lib/client only covers API failures.
    console.error(error);
  }, [error]);
  return (
    <main className="wrap">
      <div className="card" style={{ marginTop: 24 }}>
        <h2>⚠️ {ta ? "இந்தப் பக்கம் ஏற்ற முடியவில்லை" : "This page could not load"}</h2>
        <p className="muted">
          {ta
            ? "ஏதோ தவறு நடந்துவிட்டது. மீண்டும் முயற்சிக்கவும் — உங்கள் தரவு பாதுகாப்பாக உள்ளது."
            : "Something went wrong while showing this page. Please try again — your data is safe."}
        </p>
        <button className="btn primary" onClick={() => (retry ?? reset)?.()}>
          {ta ? "மீண்டும் முயற்சி" : "Try again"}
        </button>
      </div>
    </main>
  );
}
