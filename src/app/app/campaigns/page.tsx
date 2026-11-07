"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { Field, ErrBox, Badge } from "@/components/ui";
import { api, money } from "@/lib/client";

interface Campaign { id: number; name: string; objective: string; category: string; status: string; budget_minor: number; currency: string; is_sample: boolean; workflow_status: string }
const OBJECTIVES = ["sales", "awareness", "traffic", "leads", "engagement"];

export default function Campaigns() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [rows, setRows] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("sales");
  const [budget, setBudget] = useState("");
  const [err, setErr] = useState("");
  const [confirmKill, setConfirmKill] = useState(false);
  const [killOn, setKillOn] = useState(false);

  async function refresh() {
    const d = await api("/api/campaigns").catch(() => ({ campaigns: [] }));
    setRows((d.campaigns as Campaign[]) ?? []);
    const a = await api("/api/account").catch(() => ({}) as Record<string, unknown>);
    setKillOn(Boolean((a as { killSwitchPlatform?: boolean }).killSwitchPlatform));
  }
  useEffect(() => { refresh(); }, []);

  async function create() {
    setErr("");
    try {
      await api("/api/campaigns", { method: "POST", body: JSON.stringify({ action: "create", name, objective, budgetMajor: Number(budget) || 0 }) });
      setName(""); setBudget("");
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  async function act(id: number, action: string, extra: Record<string, unknown> = {}) {
    setErr("");
    try {
      await api("/api/campaigns", { method: "POST", body: JSON.stringify({ action, id, ...extra }) });
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  return (
    <AppShell>
      <h1>📣 {ta ? "பிரச்சாரங்கள்" : "Campaigns"}</h1>
      <p className="muted">{ta ? "பட்ஜெட் வழிகாட்டுதல் மட்டுமே — தளம் ஒருபோதும் உங்கள் பணத்தைச் செலவிடாது. உண்மையான விளம்பரங்கள் உரிமையாளர் தன் Meta/Google கணக்குகளை இணைக்கும்போது மட்டுமே." : "Budgets are guidance only — the platform never spends your money. Real ads run only when the owner connects his own Meta/Google accounts."} <Badge kind="reg" lang={lang} /></p>
      <div className="card">
        <h3>{ta ? "புதிய பிரச்சாரம்" : "New campaign"}</h3>
        <Field label={ta ? "பெயர்" : "Name"}><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={ta ? "நோக்கம்" : "Objective"}>
          <select value={objective} onChange={(e) => setObjective(e.target.value)}>{OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        </Field>
        <Field label={ta ? "பட்ஜெட் வழிகாட்டுதல் (₹)" : "Budget guidance (₹)"}><input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></Field>
        <ErrBox msg={err} />
        <button className="btn primary" onClick={create}>{ta ? "உருவாக்கு" : "Create campaign"}</button>
        <p className="small muted">{ta ? "குறிப்பு: உங்கள் முதல் சொந்தப் பிரச்சாரம், உங்களை அழைத்தவருக்கான referral செயல்பாட்டை எண்ணும்." : "Note: your first self-created campaign counts as your inviter's referral activation."}</p>
      </div>
      {rows.map((c) => (
        <div key={c.id} className="card">
          <div className="row"><b>{c.name}</b>{c.is_sample && <span className="badge sim">SAMPLE</span>}<span className="badge">{c.status}</span><span className="badge">{c.workflow_status}</span></div>
          <p className="small muted">{c.objective} · {money(c.budget_minor, c.currency)} {ta ? "வழிகாட்டுதல்" : "guidance"}</p>
          <div className="row">
            {c.status !== "active" && <button className="btn small primary" onClick={() => act(c.id, "status", { status: "active" })}>{ta ? "செயல்படுத்து" : "Activate"}</button>}
            {c.status === "active" && <button className="btn small" onClick={() => act(c.id, "status", { status: "paused" })}>{ta ? "இடைநிறுத்து" : "Pause"}</button>}
            <button className="btn small" onClick={() => act(c.id, "status", { status: "archived" })}>{ta ? "காப்பகம்" : "Archive"}</button>
            <button className="btn small danger" onClick={() => act(c.id, "delete")}>{ta ? "நீக்கு" : "Delete"}</button>
          </div>
        </div>
      ))}
      <div className="card" style={{ borderColor: "rgba(248,113,113,0.5)" }}>
        <h3>⛔ Kill Switch {killOn ? "— ON" : ""}</h3>
        <p className="muted">{ta ? "தள அளவிலான Kill Switch உரிமையாளரால் மட்டுமே இயக்கப்படும்; இயக்கப்பட்டால் எல்லாப் பிரச்சாரச் செயல்பாடுகளும் நிற்கும்." : "The platform Kill Switch is owner-only; while ON, every campaign activation stops."}</p>
        {!confirmKill ? (
          <button className="btn danger" onClick={() => setConfirmKill(true)}>{ta ? "ஆபத்து மண்டலம்" : "Danger zone"}</button>
        ) : (
          <p className="small">{ta ? "Kill Switch உரிமையாளர் கட்டுப்பாட்டில் உள்ளது — Owner Control-இல் மட்டுமே மாற்ற முடியும்." : "The Kill Switch lives in Owner Control — it can only be changed there."} <button className="btn small" onClick={() => setConfirmKill(false)}>{ta ? "மூடு" : "Close"}</button></p>
        )}
      </div>
    </AppShell>
  );
}
