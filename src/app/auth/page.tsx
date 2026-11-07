"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell, useLang } from "@/components/Shell";
import { Field, ErrBox } from "@/components/ui";
import { api } from "@/lib/client";
import { COUNTRIES } from "@/lib/registry";

function AuthForm() {
  const params = useSearchParams();
  const [lang] = useLang();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");
  const [ref, setRef] = useState((params.get("ref") ?? "").toUpperCase());
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const ta = lang === "ta";

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) setRef(r.toUpperCase());
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await api("/api/auth", {
        method: "POST",
        body: JSON.stringify(
          mode === "signup"
            ? { action: "signup", name, email, password, country, city, ref }
            : { action: "signin", email, password },
        ),
      });
      const user = res.user as { is_owner?: boolean } | null;
      if (mode === "signup" && !user?.is_owner) {
        window.location.href = "/app/categories";
      } else {
        window.location.href = "/app";
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <h1>{mode === "signup" ? (ta ? "கணக்கு உருவாக்குக" : "Create your account") : ta ? "உள்நுழைக" : "Sign in"}</h1>
      {ref && mode === "signup" && (
        <p className="okbox">🎉 {ta ? "நீங்கள் அழைக்கப்பட்டீர்கள் — குறியீடு பயன்படுத்தப்படும்:" : "You were invited — this code will be applied:"} <b>{ref}</b></p>
      )}
      <button type="button" className="btn" style={{ width: "100%", background: "#fff", color: "#111", fontWeight: 700 }} disabled title="Being connected">
        G — {ta ? "Google கணக்கில் தொடரவும்" : "Continue with Google"}
      </button>
      <p className="small muted" style={{ textAlign: "center" }}>
        {ta
          ? "Google உள்நுழைவு — இணைக்கப்படுகிறது. இந்த app உங்கள் Google password-ஐ ஒருபோதும் கேட்காது; உண்மையான Google உள்நுழைவு Google-இன் சொந்தப் பக்கத்தில் நடக்கும். அதுவரை மின்னஞ்சல் + கடவுச்சொல் வேலை செய்கிறது — iPhone-இலும் கணினியிலும் ஒரே மாதிரி."
          : "Google sign-in — being connected. This app never asks for a Google password; real Google sign-in happens on Google's own page. Until then, email + password works — the same on iPhone and computer."}{" "}
        <span className="badge reg">{ta ? "பதிவு · REGISTERED" : "REGISTERED"}</span>
      </p>
      <form onSubmit={submit} className="card">
        {mode === "signup" && (
          <>
            <Field label={ta ? "உங்கள் பெயர்" : "Your name"}>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label={ta ? "நாடு" : "Country"}>
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.en}>{ta ? c.ta : c.en}</option>
                ))}
              </select>
            </Field>
            <Field label={ta ? "நகரம் (விருப்பம்)" : "City (optional)"}>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={ta ? "உங்கள் நகரம்" : "Your city"} />
            </Field>
            <Field label={ta ? "அழைப்புக் குறியீடு (இருந்தால்)" : "Invite code (if you have one)"}>
              <input value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} />
            </Field>
          </>
        )}
        <Field label={ta ? "மின்னஞ்சல்" : "Email"}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </Field>
        <Field label={ta ? "கடவுச்சொல்" : "Password"}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        </Field>
        <ErrBox msg={err} />
        <button className="btn primary" style={{ width: "100%" }} disabled={busy}>
          {busy ? "…" : mode === "signup" ? (ta ? "கணக்கு உருவாக்குக" : "Create account") : ta ? "உள்நுழைக" : "Sign in"}
        </button>
        <p className="small muted" style={{ textAlign: "center" }}>
          {mode === "signup" ? (
            <a href="#" onClick={(e) => { e.preventDefault(); setMode("signin"); }}>{ta ? "ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையுங்கள்" : "Already have an account? Sign in"}</a>
          ) : (
            <a href="#" onClick={(e) => { e.preventDefault(); setMode("signup"); }}>{ta ? "புதியவரா? கணக்கு உருவாக்குங்கள்" : "New here? Create an account"}</a>
          )}
        </p>
        {mode === "signup" && (
          <p className="small muted">
            {ta
              ? "முதல் 1,000 கணக்குகள் Founders — 90 இலவச Premium நாட்கள். அழைப்புக் குறியீட்டுடன் பதிவு செய்தால் மேலும் 14 நாட்கள்."
              : "The first 1,000 accounts are Founders — 90 free Premium days. Signing up with an invite code adds 14 more days."}
          </p>
        )}
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <AuthForm />
      </Suspense>
    </AppShell>
  );
}
