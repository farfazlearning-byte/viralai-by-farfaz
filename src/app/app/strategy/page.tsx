"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { ErrBox } from "@/components/ui";
import { api } from "@/lib/client";

interface Pos { level: string; sourceLabel: string; premiumViaFreeDays: boolean; currentEndsAt: string | null }

const BENEFITS: Record<string, { en: string[]; ta: string[] }> = {
  free: { en: ["Campaigns & Studio basics", "Free starter designs", "Showcase & Explore"], ta: ["Campaign-கள் & Studio அடிப்படை", "இலவச starter design-கள்", "Showcase & Explore"] },
  basic: { en: ["Everything in Free", "Premium design families (save & attach)", "Team Workspaces", "Delivery Partner registration"], ta: ["Free-இல் உள்ள அனைத்தும்", "Premium design குடும்பங்கள் (சேமி & இணை)", "குழு பணியிடங்கள்", "Delivery கூட்டாளர் பதிவு"] },
  high: { en: ["Everything in Basic", "Autopilot prepares up to 3 draft campaigns for your review", "Priority strategy board"], ta: ["Basic-இல் உள்ள அனைத்தும்", "Autopilot உங்கள் மதிப்பாய்வுக்கு 3 வரைவு campaign-கள் வரை தயாரிக்கிறது", "முன்னுரிமை strategy board"] },
};

export default function Strategy() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [pos, setPos] = useState<Pos>({ level: "free", sourceLabel: "FREE", premiumViaFreeDays: false, currentEndsAt: null });
  const [campaigns, setCampaigns] = useState<Array<{ id: number; name: string; category: string; status: string }>>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // /api/account returns the position in the server contract
  // {tier, sourceLabel, viaFreeDays, premiumFreeUntil} — this page used to
  // read it as {level, premiumViaFreeDays, currentEndsAt} and render
  // pos.level.toUpperCase() on undefined: a TypeError the moment the data
  // landed, which froze navigation. Map the real contract, and surface
  // load failures in an error box instead of swallowing them.
  useEffect(() => {
    api("/api/account")
      .then((d) => {
        const p = d.position as { tier: string; sourceLabel: string; viaFreeDays: boolean; premiumFreeUntil: string | null };
        setPos({ level: p.tier, sourceLabel: p.sourceLabel, premiumViaFreeDays: p.viaFreeDays, currentEndsAt: p.premiumFreeUntil });
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Error"));
    api("/api/campaigns")
      .then((d) => setCampaigns((d.campaigns as typeof campaigns) ?? []))
      .catch((e) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  async function prepareDrafts() {
    const ideas = [
      { name: ta ? "Autopilot வரைவு 1 — முக்கிய சலுகை" : "Autopilot draft 1 — Hero offer", objective: "sales" },
      { name: ta ? "Autopilot வரைவு 2 — நம்பிக்கை" : "Autopilot draft 2 — Trust builder", objective: "leads" },
      { name: ta ? "Autopilot வரைவு 3 — பண்டிகை" : "Autopilot draft 3 — Festival push", objective: "awareness" },
    ];
    for (const idea of ideas) {
      // The campaigns API requires action:"create" — without it the POST
      // fell through to the by-id handlers and 404'd, while this page still
      // showed a success message. Send the real contract; failures surface.
      await api("/api/campaigns", { method: "POST", body: JSON.stringify({ action: "create", ...idea }) })
        .catch((e) => setErr(e instanceof Error ? e.message : "Error"));
    }
    setMsg(ta ? "3 வரைவு campaign-கள் தயார் — Campaigns பக்கத்தில் பாருங்கள். எதுவும் வெளியிடப்படவில்லை, செலவிடப்படவில்லை." : "3 draft campaigns prepared — see the Campaigns page. Nothing was published or spent.");
    const d = await api("/api/campaigns").catch(() => ({}) as Record<string, unknown>);
    setCampaigns((d.campaigns as typeof campaigns) ?? []);
  }

  const benefits = BENEFITS[pos.level] ?? BENEFITS.free;
  return (
    <AppShell>
      <h1>🧭 {ta ? "என் Strategy" : "My Strategy"}</h1>
      <ErrBox msg={err} />
      <div className="card">
        <p>{ta ? "உங்கள் நிலை:" : "Your position:"} <b>{pos.level.toUpperCase()}</b> <span className="badge">{pos.sourceLabel}</span>
        {pos.premiumViaFreeDays && <span className="badge free" style={{ marginLeft: 6 }}>Premium (free days)</span>}
        {pos.currentEndsAt && <span className="muted small"> · {ta ? "முடிவு:" : "Ends:"} {new Date(pos.currentEndsAt).toLocaleDateString()}</span>}</p>
        <ul>{(ta ? benefits.ta : benefits.en).map((b, i) => <li key={i}>{b}</li>)}</ul>
      </div>
      <div className="card">
        <h3>🤖 {ta ? "Autopilot" : "Autopilot"}</h3>
        <p className="small muted">{ta ? "Autopilot ஒருபோதும் விளம்பரங்களை வெளியிடாது, பணம் செலவிடாது, கட்டணம் வசூலிக்காது. High நிலையில் அது வரைவுகளை மட்டுமே தயாரிக்கும் — முடிவு எப்போதும் உங்களுடையது." : "Autopilot NEVER publishes ads, spends money or charges you. On High it only prepares drafts — the decision is always yours."}</p>
        {pos.level === "high" ? (
          <button className="btn primary" onClick={prepareDrafts}>{ta ? "3 வரைவு campaign-களைத் தயாரி" : "Prepare 3 draft campaigns"}</button>
        ) : (
          <p className="muted">{ta ? "வரைவு தயாரிப்பு High நிலையில் கிடைக்கும் (Plans பக்கம்)." : "Draft preparation is available on the High position (see Plans)."}</p>
        )}
        {msg && <p className="okbox">{msg}</p>}
      </div>
      <div className="card">
        <h3>{ta ? "உங்கள் campaign-கள்" : "Your campaigns"}</h3>
        {campaigns.length === 0 && <p className="muted">{ta ? "இன்னும் இல்லை." : "None yet."}</p>}
        {campaigns.slice(0, 8).map((c) => <p key={c.id} className="small">{c.name} — <span className="badge">{c.status}</span></p>)}
      </div>
    </AppShell>
  );
}
