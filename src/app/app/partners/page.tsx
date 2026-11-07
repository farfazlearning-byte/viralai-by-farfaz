"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang, useMe } from "@/components/Shell";
import { api } from "@/lib/client";

interface Partner {
  id: number; key: string; name: string; category: string; status: string;
  how_money_flows_en: string; how_money_flows_ta: string; owner_step_en: string; owner_step_ta: string;
  typical_terms_en: string; typical_terms_ta: string; tracked_link: string; clicks: number; signups: number;
}
interface Template { title_en: string; title_ta: string; body_en: string; body_ta: string }

const CAT_LABEL: Record<string, { en: string; ta: string }> = {
  A: { en: "Ad platforms", ta: "விளம்பர தளங்கள்" },
  B: { en: "Publisher networks", ta: "வெளியீட்டாளர் வலையமைப்புகள்" },
  C: { en: "Affiliate programmes", ta: "இணை நிகழ்ச்சிகள்" },
  D: { en: "Sponsorship slots", ta: "ஸ்பான்சர் இடங்கள்" },
};

export default function Partners() {
  const [lang] = useLang();
  const { me } = useMe();
  const ta = lang === "ta";
  const [partners, setPartners] = useState<Partner[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [earnings, setEarnings] = useState({ earnedMinor: 0, partnersJoined: 0 });
  const [linkDrafts, setLinkDrafts] = useState<Record<number, string>>({});

  async function refresh() {
    const d = await api("/api/partners").catch(() => ({ partners: [], templates: [], earnings: { earnedMinor: 0, partnersJoined: 0 } }));
    setPartners((d.partners as Partner[]) ?? []);
    setTemplates((d.templates as Template[]) ?? []);
    setEarnings((d.earnings as typeof earnings) ?? earnings);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function post(body: Record<string, unknown>) {
    await api("/api/partners", { method: "POST", body: JSON.stringify(body) }).catch(() => {});
    refresh();
  }
  async function copy(text: string) { try { await navigator.clipboard.writeText(text); } catch { /* ignore */ } }

  return (
    <AppShell>
      <h1>🤝 {ta ? "கூட்டாளர்கள் & வருமானம்" : "Partners & Earnings"}</h1>
      <p className="muted">{ta ? "எல்லா கூட்டாளர்களும் பதிவு செய்யப்பட்டவை (REGISTERED) — இன்னும் இணைக்கப்படவில்லை. பணம் ஒரு நிகழ்ச்சி உண்மையில் செலுத்தும் வரை வருமானம் ₹0." : "All partners are REGISTERED — not yet joined. Earnings stay ₹0 until a programme actually pays."}</p>
      <p className="small">{ta ? "வெளிப்படைத்தன்மை: கூட்டாளர் இணைப்புகள் மூலம் நீங்கள் சேர்ந்தால் எங்களுக்கு கமிஷன் கிடைக்கலாம் — உங்களுக்கு கூடுதல் செலவு இல்லை." : "Disclosure: if you join through a partner link we may earn a commission — it costs you nothing extra."}</p>
      <div className="grid">
        <div className="card"><div className="kpi">₹{(earnings.earnedMinor / 100).toFixed(0)}</div><p className="muted">{ta ? "இதுவரை ஈட்டியது" : "Earned so far"}</p></div>
        <div className="card"><div className="kpi">{earnings.partnersJoined}</div><p className="muted">{ta ? "சேர்ந்த நிகழ்ச்சிகள்" : "Programmes joined"}</p></div>
      </div>
      {(["A", "B", "C", "D"] as const).map((cat) => (
        <div key={cat}>
          <h2>{ta ? CAT_LABEL[cat].ta : CAT_LABEL[cat].en}</h2>
          <div className="grid">
            {partners.filter((p) => p.category === cat).map((p) => (
              <div key={p.id} className="card">
                <h3>{p.name} <span className="badge reg">{p.status === "joined" ? (ta ? "சேர்ந்துள்ளது" : "JOINED") : "REGISTERED"}</span></h3>
                <p className="small">{ta ? p.how_money_flows_ta : p.how_money_flows_en}</p>
                <p className="small muted">{ta ? p.typical_terms_ta : p.typical_terms_en} {ta ? "(உறுதி அல்ல)" : "(not a promise)"}</p>
                <p className="small muted">{ta ? "உரிமையாளர் படி:" : "Owner step:"} {ta ? p.owner_step_ta : p.owner_step_en}</p>
                <p className="small">👆 {p.clicks} · ✍️ {p.signups}</p>
                {p.tracked_link ? (
                  <div className="row">
                    <button className="btn small" onClick={() => post({ action: "click", partnerId: p.id })}>{ta ? "இணைப்பைத் திற" : "Open link"}</button>
                    <button className="btn small" onClick={() => post({ action: "signup", partnerId: p.id })}>{ta ? "நான் சேர்ந்துவிட்டேன்" : "I joined"}</button>
                  </div>
                ) : <p className="small muted">{ta ? "கண்காணிப்பு இணைப்பு இன்னும் இல்லை — உரிமையாளர் சேர்ப்பார்." : "No tracked link yet — the owner will add it."}</p>}
                {me?.is_owner && (
                  <div className="row">
                    <input style={{ width: 220 }} placeholder="https://…" value={linkDrafts[p.id] ?? p.tracked_link} onChange={(e) => setLinkDrafts({ ...linkDrafts, [p.id]: e.target.value })} />
                    <button className="btn small" onClick={() => post({ action: "setLink", partnerId: p.id, link: linkDrafts[p.id] ?? "" })}>{ta ? "இணைப்பைச் சேமி" : "Save link"}</button>
                    <button className="btn small" onClick={() => post({ action: "setStatus", partnerId: p.id, status: p.status === "joined" ? "registered" : "joined" })}>{p.status === "joined" ? (ta ? "பதிவு நிலைக்கு" : "Mark registered") : (ta ? "சேர்ந்ததாகக் குறி" : "Mark joined")}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <h2>✉️ {ta ? "தொடர்பு கருவி (Outreach kit)" : "Partner Outreach Kit"}</h2>
      <p className="muted small">{ta ? "app யாரையும் தானாகத் தொடர்பு கொள்ளாது — அனுப்புவது உரிமையாளரின் தட்டுதல்." : "The app contacts nobody itself — sending is the owner's tap."}</p>
      <div className="grid">
        {templates.map((t, i) => (
          <div key={i} className="card">
            <h3>{ta ? t.title_ta : t.title_en}</h3>
            <p className="small" style={{ whiteSpace: "pre-wrap" }}>{ta ? t.body_ta : t.body_en}</p>
            <button className="btn small" onClick={() => copy(ta ? t.body_ta : t.body_en)}>{ta ? "நகலெடு" : "Copy"}</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
