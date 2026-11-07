"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { api } from "@/lib/client";
import { COUNTRIES } from "@/lib/registry";

interface Cell { code: string; country: string; countryTa: string; activity: number; paymentRoute: string; paymentStatus: string }

const SKILLS: Array<{ en: string; ta: string }> = [
  { en: "Write a headline that names the benefit, not the product", ta: "பொருளை அல்ல, பயனைச் சொல்லும் தலைப்பு எழுதுங்கள்" },
  { en: "One offer per ad — two offers halve the response", ta: "ஒரு விளம்பரத்தில் ஒரு சலுகை — இரண்டு சலுகைகள் பதிலைப் பாதியாக்கும்" },
  { en: "Festival weeks: post 10 days before, remind 2 days before", ta: "பண்டிகை வாரங்கள்: 10 நாட்கள் முன் பதிவிடுங்கள், 2 நாட்கள் முன் நினைவூட்டுங்கள்" },
  { en: "Show the price when the price is your strength", ta: "விலை உங்கள் பலம் என்றால் விலையைக் காட்டுங்கள்" },
  { en: "Every ad needs one clear next step (call, visit, order)", ta: "ஒவ்வொரு விளம்பரத்துக்கும் ஒரு தெளிவான அடுத்த படி (அழைப்பு, வருகை, order)" },
  { en: "Use your own photos of your own shop — trust beats stock", ta: "உங்கள் கடையின் சொந்தப் புகைப்படங்களைப் பயன்படுத்துங்கள் — நம்பிக்கை stock-ஐ வெல்லும்" },
];

const FESTIVALS: Array<{ en: string; ta: string; when: string }> = [
  { en: "Diwali / Deepavali", ta: "தீபாவளி", when: "Oct–Nov" },
  { en: "Pongal", ta: "பொங்கல்", when: "Mid Jan" },
  { en: "Ramadan & Eid", ta: "ரமலான் & ஈத்", when: "Varies (lunar)" },
  { en: "Christmas & New Year", ta: "கிறிஸ்துமஸ் & புத்தாண்டு", when: "Dec–Jan" },
  { en: "Back to School", ta: "பள்ளி திறப்பு", when: "Jun / Sep by country" },
  { en: "Wedding season", ta: "திருமண சீசன்", when: "Varies locally" },
];

export default function Explore() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [cells, setCells] = useState<Cell[]>([]);
  const [picked, setPicked] = useState<Cell | null>(null);
  const [myCountry, setMyCountry] = useState("");
  const [myCity, setMyCity] = useState("");
  const [detectMsg, setDetectMsg] = useState("");

  useEffect(() => {
    api("/api/public").then((d) => setCells((d.cells as Cell[]) ?? [])).catch(() => {});
    api("/api/account").then((d) => {
      const u = d.user as { country?: string; city?: string };
      setMyCountry(u?.country ?? "");
      setMyCity(u?.city ?? "");
    }).catch(() => {});
  }, []);

  function detect() {
    if (!("geolocation" in navigator)) { setDetectMsg(ta ? "இந்த browser-இல் இருப்பிடம் கிடைக்கவில்லை — கீழே கையால் தேர்ந்தெடுங்கள்." : "Location is not available in this browser — pick manually below."); return; }
    navigator.geolocation.getCurrentPosition(
      () => setDetectMsg(ta ? "இருப்பிடம் அனுமதி கிடைத்தது. உங்கள் நாடு/நகரத்தைக் கீழே உறுதிப்படுத்துங்கள் (துல்லியமான நகரப் பெயர் browser தராது)." : "Location permission granted. Please confirm your country/city below (browsers do not give an exact city name)."),
      () => setDetectMsg(ta ? "இருப்பிடம் மறுக்கப்பட்டது அல்லது கிடைக்கவில்லை — கீழே கையால் தேர்ந்தெடுங்கள்." : "Location was denied or unavailable — pick manually below."),
    );
  }

  async function savePlace() {
    await api("/api/account", { method: "POST", body: JSON.stringify({ action: "profile", country: myCountry, city: myCity }) }).catch(() => {});
    setDetectMsg(ta ? "சேமிக்கப்பட்டது." : "Saved.");
  }

  const local = cells.find((c) => c.country === myCountry);
  return (
    <AppShell>
      <h1>🧭 {ta ? "ஆராய்க — உங்கள் இடம்" : "Explore — your place"}</h1>
      <div className="card">
        <h3>📍 {myCity ? `${myCity}, ` : ""}{myCountry || (ta ? "உங்கள் நகரம்" : "Your city")}</h3>
        <p className="muted">{ta ? "உங்கள் உள்ளூர் பக்கம் உங்கள் சொந்த நாடு மற்றும் நகரத்திலிருந்து உருவாகிறது." : "Your local page is built from your own country and city."}</p>
        <div className="row">
          <button className="btn small" onClick={detect}>{ta ? "என் இருப்பிடத்தைப் பயன்படுத்து" : "Use my location"}</button>
          <select value={myCountry} onChange={(e) => setMyCountry(e.target.value)} style={{ width: "auto" }}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.en}>{ta ? c.ta : c.en}</option>)}
          </select>
          <input style={{ width: 160 }} value={myCity} onChange={(e) => setMyCity(e.target.value)} placeholder={ta ? "நகரம்" : "City"} />
          <button className="btn small primary" onClick={savePlace}>{ta ? "சேமி" : "Save"}</button>
        </div>
        {detectMsg && <p className="small muted">{detectMsg}</p>}
        {local && <p className="small">{ta ? "உங்கள் நாட்டில் செயல்பாடு:" : "Activity in your country:"} {local.activity} · {ta ? "பண வழி:" : "Payment route:"} {local.paymentRoute === "upi_qr" ? "UPI QR" : ta ? "வங்கி மாற்றம் (wire)" : "Bank transfer (wire)"}</p>}
      </div>

      <h2>🌍 {ta ? "உலக வரைபடம் (பெயர்கள் மட்டும்)" : "World board (labels only)"}</h2>
      <p className="muted small">{ta ? "ஒரே QR உலகம் முழுவதும் வேலை செய்யாது — ஒவ்வொரு நாட்டுக்கும் அதன் வழி." : "No single QR works worldwide — each country has its route."}</p>
      <div className="mapgrid">
        {cells.map((c) => (
          <button key={c.code} className={`mapcell ${c.activity > 0 ? "hot" : ""}`} onClick={() => setPicked(c)}>
            <b>{ta ? c.countryTa : c.country}</b>
            <div className="small muted">{c.paymentRoute === "upi_qr" ? "UPI QR" : "Wire"} · {c.paymentStatus === "live" ? (ta ? "நேரடி" : "LIVE") : (ta ? "விவரங்கள் வருகின்றன" : "Details coming")}</div>
          </button>
        ))}
      </div>
      {picked && (
        <div className="card">
          <h3>{ta ? picked.countryTa : picked.country}</h3>
          <p className="small">{ta ? "செயல்பாடு (உறுப்பினர்கள் + கடைகள்):" : "Activity (members + stores):"} {picked.activity}</p>
          <p className="small muted">{ta ? "பணம்: " : "Payments: "}{picked.paymentRoute === "upi_qr" ? "UPI QR (India)" : ta ? "உரிமையாளரின் கனடா கணக்குக்கு வங்கி மாற்றம்" : "Bank transfer to the owner's Canada account"}</p>
        </div>
      )}

      <h2>🎉 {ta ? "பண்டிகை நாட்காட்டி" : "Festival calendar"} {myCountry ? `— ${myCountry}` : ""}</h2>
      <div className="grid">
        {FESTIVALS.map((f) => (
          <div key={f.en} className="card"><b>{ta ? f.ta : f.en}</b><p className="small muted">{f.when}</p></div>
        ))}
      </div>

      <h2>🧠 {ta ? "விளம்பரத் திறன்கள்" : "Ad skills directory"}</h2>
      <div className="grid">
        {SKILLS.map((s, i) => (
          <div key={i} className="card"><p>{ta ? s.ta : s.en}</p></div>
        ))}
      </div>
      <p className="small muted">{ta ? "பட்ஜெட் பிரிப்பு வழிகாட்டுதல்: பொதுவாக 60% உங்கள் வலுவான சேனல், 25% இரண்டாவது, 15% சோதனை — இது வழிகாட்டுதல் மட்டுமே, உறுதி அல்ல." : "Budget-split guidance: a common start is 60% your strongest channel, 25% a second, 15% experiments — guidance only, never a promise."}</p>
    </AppShell>
  );
}
