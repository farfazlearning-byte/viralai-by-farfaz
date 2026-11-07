"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, useLang, useMe } from "@/components/Shell";
import { Badge, Busy } from "@/components/ui";
import { api } from "@/lib/client";

interface DashData {
  user: { name: string; founder_number: number | null };
  position: { tier: string; viaFreeDays: boolean; sourceLabel: string; premiumFreeUntil: string | null };
  counts: { campaigns: number; creatives: number; stores: number };
  killSwitchPlatform: boolean;
}

// Simulated guidance figures — deterministic pseudo-metrics derived from the
// member's own counts, ALWAYS labelled SIMULATED. They are planning guidance,
// never real ad-platform results.
function simulated(count: number, seed: number): number {
  const x = Math.sin(seed * 127.1 + count * 311.7) * 43758.5453;
  return Math.floor((x - Math.floor(x)) * 900) + 100;
}

export default function Dashboard() {
  const [lang] = useLang();
  const { me, loading } = useMe();
  const [data, setData] = useState<DashData | null>(null);
  useEffect(() => {
    if (me) api("/api/account").then((d) => setData(d as unknown as DashData)).catch(() => {});
  }, [me]);
  const ta = lang === "ta";
  if (loading) return <AppShell><Busy lang={lang} /></AppShell>;
  if (!me) return <AppShell><p>{ta ? "முதலில் உள்நுழையுங்கள்." : "Please sign in first."} <Link href="/auth">{ta ? "உள்நுழைக" : "Sign in"}</Link></p></AppShell>;
  const c = data?.counts ?? { campaigns: 0, creatives: 0, stores: 0 };
  const reach = simulated(c.campaigns + c.creatives, 3);
  const clicks = simulated(c.campaigns, 7);
  const roas = (2 + (simulated(c.creatives, 11) % 200) / 100).toFixed(1);
  return (
    <AppShell>
      <h1>{ta ? `வணக்கம், ${me.name}` : `Welcome, ${me.name}`}</h1>
      <div className="row">
        {me.founder_number ? <span className="badge premium">🏆 Founder #{me.founder_number}</span> : null}
        {data?.position && (
          <span className="badge live">
            {data.position.tier === "high" ? "High" : data.position.tier === "basic" ? (data.position.viaFreeDays ? (ta ? "Premium (இலவச நாட்கள்)" : "Premium (free days)") : "Basic") : ta ? "இலவசம்" : "Free"}
            {" · "}{data.position.sourceLabel}
          </span>
        )}
        {data?.killSwitchPlatform && <span className="badge sim">⛔ Kill Switch ON</span>}
      </div>

      <h2>{ta ? "உங்கள் உண்மையான எண்ணிக்கைகள்" : "Your real numbers"}</h2>
      <div className="grid">
        <div className="card"><div className="kpi">{c.campaigns}</div><p className="muted">{ta ? "பிரச்சாரங்கள்" : "Campaigns"}</p><Link className="btn small" href="/app/campaigns">{ta ? "திற" : "Open"}</Link></div>
        <div className="card"><div className="kpi">{c.creatives}</div><p className="muted">{ta ? "சேமித்த designs" : "Saved designs"}</p><Link className="btn small" href="/app/studio">{ta ? "திற" : "Open"}</Link></div>
        <div className="card"><div className="kpi">{c.stores}</div><p className="muted">{ta ? "கடைகள்" : "Stores"}</p><Link className="btn small" href="/app/stores">{ta ? "திற" : "Open"}</Link></div>
      </div>

      <h2>{ta ? "திட்டமிடல் வழிகாட்டுதல்" : "Planning guidance"} <Badge kind="sim" lang={lang} /></h2>
      <p className="muted small">{ta ? "இந்த எண்கள் உருவகப்படுத்திய வழிகாட்டுதல் — உண்மையான விளம்பர முடிவுகள் அல்ல. உண்மையான தளங்கள் இணையும்போது உண்மையான எண்கள் வரும்." : "These figures are simulated guidance — not real ad results. Real numbers arrive when real platforms are connected."}</p>
      <div className="grid">
        <div className="card"><div className="kpi">{reach.toLocaleString()}</div><p className="muted">{ta ? "மதிப்பிட்ட அணுகல்" : "Estimated reach"} <Badge kind="sim" lang={lang} /></p></div>
        <div className="card"><div className="kpi">{clicks.toLocaleString()}</div><p className="muted">{ta ? "மதிப்பிட்ட கிளிக்குகள்" : "Estimated clicks"} <Badge kind="sim" lang={lang} /></p></div>
        <div className="card"><div className="kpi">{roas}×</div><p className="muted">ROAS <Badge kind="sim" lang={lang} /></p></div>
      </div>

      <div className="card">
        <h3>🛰️ {ta ? "அடுத்த படிகள்" : "Next steps"}</h3>
        <div className="row">
          <Link className="btn primary" href="/app/studio">{ta ? "விளம்பரம் உருவாக்குக" : "Create an ad"}</Link>
          <Link className="btn" href="/app/library">{ta ? "Design நூலகம்" : "Design Library"}</Link>
          <Link className="btn" href="/app/growth">{ta ? "நண்பர்களை அழைக்க" : "Invite friends"}</Link>
          <Link className="btn" href="/app/plans">{ta ? "திட்டங்கள்" : "Plans"}</Link>
        </div>
      </div>
    </AppShell>
  );
}
