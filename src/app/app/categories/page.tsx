"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { ErrBox } from "@/components/ui";
import { api } from "@/lib/client";
import { CATEGORIES } from "@/lib/categories";

export default function CategoriesPage() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [picked, setPicked] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    api("/api/account").then((d) => setPicked((d.chosenCategories as string[]) ?? [])).catch(() => {});
  }, []);
  function toggle(key: string) {
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length >= 3 ? p : [...p, key]));
  }
  async function save() {
    try {
      await api("/api/account", { method: "POST", body: JSON.stringify({ action: "categories", categories: picked }) });
      setMsg(ta ? "சேமிக்கப்பட்டது! உங்கள் வகைகளுக்கு ஏற்ற designs நூலகத்தில் முதலில் வரும்." : "Saved! Designs fitted to your categories come first in the Library.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }
  return (
    <AppShell>
      <h1>{ta ? "உங்கள் தொழில் வகைகள்" : "Your business categories"}</h1>
      <p className="muted">{ta ? `48 வகைகளில் அதிகபட்சம் 3-ஐத் தேர்ந்தெடுங்கள் — அல்லது தவிர்க்கவும். (${picked.length}/3)` : `Pick up to 3 of the 48 categories — or skip. (${picked.length}/3)`}</p>
      <div className="grid">
        {CATEGORIES.map((c) => (
          <button key={c.key} className="mapcell" onClick={() => toggle(c.key)} style={picked.includes(c.key) ? { borderColor: "var(--gold)", background: "rgba(232,178,58,0.1)" } : undefined}>
            <div style={{ fontSize: 22 }}>{c.icon} <b>{ta ? c.ta : c.en}</b></div>
            <div className="small muted">{c.subs.join(" · ")}</div>
          </button>
        ))}
      </div>
      <ErrBox msg={err} />
      {msg && <p className="okbox">{msg}</p>}
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn primary" onClick={save}>{ta ? "சேமி" : "Save my categories"}</button>
        <a className="btn" href="/app">{ta ? "தவிர்" : "Skip"}</a>
      </div>
    </AppShell>
  );
}
