"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang, useMe } from "@/components/Shell";
import { Badge, Busy } from "@/components/ui";
import { api } from "@/lib/client";
import { SHOWCASE_DESIGNS } from "@/lib/showcaseDesigns";

interface Ad {
  id: number; slug: string; title_en: string; title_ta: string; body_en: string; body_ta: string;
  badge: string; how_made_en: string; how_made_ta: string; labelEn: string; labelTa: string; icon: string; enabled: boolean; sort: number;
}

export default function Showcase() {
  const [lang] = useLang();
  const { me } = useMe();
  const ta = lang === "ta";
  const [ads, setAds] = useState<Ad[]>([]);
  const [shareEn, setShareEn] = useState("");
  const [flipped, setFlipped] = useState<string>("");
  const [designIdx, setDesignIdx] = useState(0);
  const design = SHOWCASE_DESIGNS[designIdx % SHOWCASE_DESIGNS.length];

  useEffect(() => {
    api("/api/showcase").then((d) => { setAds((d.ads as Ad[]) ?? []); setShareEn((d.shareEn as string) ?? ""); }).catch(() => {});
  }, []);

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard unavailable */ }
  }

  return (
    <AppShell>
      <h1>🌟 {ta ? "நம்முடைய விளம்பரங்கள்" : "Our Showcase"}</h1>
      <p className="muted">{ta ? "உரிமையாளரின் சொந்தத் திட்டங்களுக்கான இலவச வீட்டு விளம்பரங்கள். ஒவ்வொரு அட்டையும் எப்படி உருவாக்கப்பட்டது என்பதைக் கற்பிக்கிறது — நீங்களும் அதே முறையில் உங்கள் விளம்பரத்தை உருவாக்கலாம்." : "Free house ads for the owner's own projects. Every card teaches how it was made — so you can make your own the same way."}</p>

      <div className="card">
        <h3>🎓 {ta ? "வழிகாட்டியுடன் சுற்றுலா" : "Guided walkthrough"}</h3>
        <ol className="small">
          <li>{ta ? "கீழே உள்ள அட்டையைப் பாருங்கள் — தலைப்பு முதலில் கவரும்." : "Look at a card below — the headline hooks first."}</li>
          <li>{ta ? "“இது எப்படி உருவாக்கப்பட்டது” என்பதைப் படியுங்கள்." : "Read its “how this ad was made” note."}</li>
          <li>{ta ? "“இந்த design-ஐப் பயன்படுத்து” தட்டினால் அதே வார்ப்புரு Studio-வில் திறக்கும்." : "Tap “Use this design” and the same template opens in the Studio."}</li>
          <li>{ta ? "உங்கள் தொழில் பெயரையும் சலுகையையும் போட்டுச் சேமியுங்கள்." : "Add your business name and offer, then save."}</li>
        </ol>
        <div className="row">
          <span className="badge">{ta ? design.ta : design.en}</span>
          <button className="btn small" onClick={() => setDesignIdx(designIdx + 1)}>{ta ? "அடுத்த design →" : "Next design →"}</button>
        </div>
        <p className="small muted">{ta ? "Showcase வடிவங்கள் அசையும் காட்சிகள் — வீடியோ கோப்புகள் அல்ல." : "Showcase designs are animated scenes — not video files."}</p>
      </div>

      <div className="grid">
        {ads.map((ad) => (
          <div key={ad.id} className="card flip holo" onClick={() => setFlipped(flipped === ad.slug ? "" : ad.slug)}>
            {flipped === ad.slug ? (
              <>
                <h3>{ad.icon} {ta ? "இது எப்படி உருவாக்கப்பட்டது" : "How this ad was made"}</h3>
                <p className="small">{ta ? ad.how_made_ta : ad.how_made_en}</p>
                <p className="small muted">{ta ? ad.labelTa : ad.labelEn}</p>
                <button className="btn small primary" onClick={(e) => { e.stopPropagation(); window.location.href = "/app/library"; }}>{ta ? "இந்த design-ஐப் பயன்படுத்து" : "Use this design"}</button>
              </>
            ) : (
              <>
                <h3>{ad.icon} {ta ? ad.title_ta : ad.title_en}</h3>
                <p>{ta ? ad.body_ta : ad.body_en}</p>
                <p className="small"><span className="badge free">{ta ? ad.labelTa : ad.labelEn}</span>{ad.badge !== "LIVE" && <span className="badge sim" style={{ marginLeft: 6 }}>{ad.badge}</span>}</p>
                <p className="small muted">{ta ? "புரட்டிப் பார்க்கத் தட்டுங்கள் ↻" : "Tap to flip ↻"}</p>
              </>
            )}
            {me?.is_owner && (
              <div className="row" onClick={(e) => e.stopPropagation()}>
                <button className="btn small" onClick={async () => { await api("/api/showcase", { method: "POST", body: JSON.stringify({ action: "setEnabled", id: ad.id, enabled: false }) }); setAds(ads.filter((a) => a.id !== ad.id)); }}>{ta ? "முடக்கு" : "Disable"}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {ads.length === 0 && <Busy lang={lang} />}

      <div className="card">
        <h3>📤 {ta ? "இரட்டை அணுகல் — பகிர்வு நகல்" : "Double reach — share copy"}</h3>
        <p className="small muted">{ta ? "இந்த நகலில் உங்கள் அழைப்பு இணைப்பு உள்ளது — Showcase-ஐப் பகிர்ந்தால் உங்கள் வளர்ச்சியும் எண்ணப்படும்." : "This copy carries your invite link — sharing the Showcase also grows your referrals."}</p>
        <textarea readOnly rows={3} value={shareEn} />
        <button className="btn small" onClick={() => copy(shareEn)}>{ta ? "நகலெடு" : "Copy"}</button>
      </div>
    </AppShell>
  );
}
