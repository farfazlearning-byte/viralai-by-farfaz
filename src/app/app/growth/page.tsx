"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { api } from "@/lib/client";

export default function Growth() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [invites, setInvites] = useState(0);
  const [activations, setActivations] = useState(0);
  const [freeDaysEarned, setFreeDaysEarned] = useState(0);
  const [nextBonusIn, setNextBonusIn] = useState(5);
  const [shareEn, setShareEn] = useState("");
  const [shareTa, setShareTa] = useState("");

  useEffect(() => {
    api("/api/growth").then((d) => {
      setCode(d.inviteCode as string); setLink(d.inviteLink as string);
      setInvites(Number(d.invites ?? 0)); setActivations(Number(d.activations ?? 0));
      setFreeDaysEarned(Number(d.freeDaysEarned ?? 0)); setNextBonusIn(Number(d.nextBonusIn ?? 5));
      setShareEn(d.shareEn as string); setShareTa(d.shareTa as string);
    }).catch(() => {});
  }, []);

  async function copy(text: string) { try { await navigator.clipboard.writeText(text); } catch { /* ignore */ } }

  return (
    <AppShell>
      <h1>🚀 {ta ? "வளர்ச்சி & அழைப்புகள்" : "Growth & Invites"}</h1>
      <div className="grid">
        <div className="card"><div className="kpi">{code}</div><p className="muted">{ta ? "உங்கள் அழைப்புக் குறியீடு" : "Your invite code"}</p></div>
        <div className="card"><div className="kpi">{invites}</div><p className="muted">{ta ? "உங்கள் இணைப்பில் சேர்ந்தவர்கள்" : "Joined via your link"}</p></div>
        <div className="card"><div className="kpi">{activations}</div><p className="muted">{ta ? "செயல்பட்ட அழைப்புகள் (முதல் சொந்த campaign)" : "Activated invites (first own campaign)"}</p></div>
        <div className="card"><div className="kpi">+{freeDaysEarned}d</div><p className="muted">{ta ? "ஈட்டிய இலவச நாட்கள்" : "Free days earned"}</p></div>
      </div>
      <div className="card">
        <h3>🔗 {ta ? "உங்கள் அழைப்பு இணைப்பு" : "Your invite link"}</h3>
        <p style={{ wordBreak: "break-all" }}>{link}</p>
        <div className="row">
          <button className="btn small primary" onClick={() => copy(link)}>{ta ? "இணைப்பை நகலெடு" : "Copy my invite link"}</button>
          <button className="btn small" onClick={() => copy(ta ? shareTa : shareEn)}>{ta ? "பகிர்வு உரையை நகலெடு" : "Copy share text"}</button>
        </div>
        <p className="small muted">{ta ? `விதிகள்: சேர்ந்தவருக்கு 14 இலவச நாட்கள்; அவர் தனது முதல் சொந்த campaign-ஐ உருவாக்கும்போது உங்களுக்கு +7 நாட்கள்; ஒவ்வொரு 5 செயல்பாடுகளுக்கும் +1 மாதம் (அடுத்த bonus: ${nextBonusIn} இன்னும்); உச்சவரம்பு 12 மாதங்கள்.` : `Rules: invitees get 14 free days; you earn +7 days when they create their first own campaign; +1 month per 5 activations (${nextBonusIn} to go); cap 12 months rolling.`}</p>
        <p className="small muted">{ta ? "Founders: முதல் 1,000 கணக்குகளுக்கு 90 இலவச Premium நாட்கள்." : "Founders: the first 1,000 accounts get 90 free Premium days."}</p>
      </div>
      <div className="card">
        <h3>📝 {ta ? "பகிர்வு உரை" : "Share text"}</h3>
        <textarea readOnly rows={4} value={ta ? shareTa : shareEn} />
        <button className="btn small" onClick={() => copy(ta ? shareTa : shareEn)}>{ta ? "நகலெடு" : "Copy"}</button>
      </div>
    </AppShell>
  );
}
