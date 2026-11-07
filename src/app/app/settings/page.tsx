"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { Field } from "@/components/ui";
import { api } from "@/lib/client";
import { COUNTRIES } from "@/lib/registry";

export default function Settings() {
  const [lang, setLang] = useLang();
  const ta = lang === "ta";
  const [name, setName] = useState("");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState("");
  useEffect(() => {
    api("/api/account").then((d) => {
      const u = d.user as { name: string; country: string; city: string };
      setName(u?.name ?? ""); setCountry(u?.country ?? "India"); setCity(u?.city ?? "");
    }).catch(() => {});
  }, []);
  async function save() {
    await api("/api/account", { method: "POST", body: JSON.stringify({ action: "profile", name, country, city }) }).catch(() => {});
    setSaved(ta ? "சேமிக்கப்பட்டது." : "Saved.");
  }
  return (
    <AppShell>
      <h1>⚙️ {ta ? "அமைப்புகள்" : "Settings"}</h1>
      <div className="card">
        <Field label={ta ? "பெயர்" : "Name"}><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={ta ? "நாடு" : "Country"}>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.en}>{ta ? c.ta : c.en}</option>)}
          </select>
        </Field>
        <Field label={ta ? "நகரம்" : "City"}><input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
        <button className="btn primary" onClick={save}>{ta ? "சேமி" : "Save"}</button>
        {saved && <p className="okbox">{saved}</p>}
      </div>
      <div className="card">
        <h3>🌐 {ta ? "மொழி" : "Language"}</h3>
        <div className="row">
          <button className={`btn small ${lang === "en" ? "primary" : ""}`} onClick={() => setLang("en")}>English</button>
          <button className={`btn small ${lang === "ta" ? "primary" : ""}`} onClick={() => setLang("ta")}>தமிழ்</button>
        </div>
      </div>
      <div className="card">
        <h3>📲 {ta ? "App-ஐப் பெறுங்கள்" : "Get the app"}</h3>
        <p className="small">{ta ? "நிறுவல் — store தேவையில்லை:" : "Install — no store needed:"}</p>
        <ol className="small">
          <li><b>iPhone:</b> Safari → Share → Add to Home Screen</li>
          <li><b>Android:</b> Chrome → Install app</li>
          <li><b>Computer:</b> Chrome/Edge → install icon in the address bar</li>
        </ol>
        <p className="small muted">{ta ? "உண்மையான store app பின்னர் வரும் படி." : "A true store app is a later step."}</p>
      </div>
    </AppShell>
  );
}
