"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, useLang } from "@/components/Shell";
import { Badge } from "@/components/ui";
import { api, type Lang } from "@/lib/client";
import { COUNTRIES } from "@/lib/registry";

interface PublicData {
  ready: boolean;
  cells: Array<{ code: string; country: string; countryTa: string; activity: number; paymentRoute: string; paymentStatus: string }>;
  connections: Array<{ key: string; status: string; note_en: string; note_ta: string }>;
  totals?: { users: number; stores: number; campaigns: number };
}

const L: Record<string, { en: string; ta: string }> = {
  heroSub: { en: "Ad intelligence for every business — in your city, in your language.", ta: "ஒவ்வொரு தொழிலுக்கும் விளம்பர அறிவு — உங்கள் நகரத்தில், உங்கள் மொழியில்." },
  cta: { en: "Create free account", ta: "இலவசக் கணக்கு உருவாக்குக" },
  cta2: { en: "Sign in", ta: "உள்நுழைக" },
  invited: { en: "You were invited! Your invite code is ready in the sign-up form — referred members get 14 free Premium days.", ta: "நீங்கள் அழைக்கப்பட்டீர்கள்! உங்கள் அழைப்புக் குறியீடு பதிவுப் படிவத்தில் தயாராக உள்ளது — அழைக்கப்பட்டவர்களுக்கு 14 இலவச Premium நாட்கள்." },
  founders: { en: "Launch offer: the first 1,000 accounts are Founders with 90 free Premium days.", ta: "தொடக்க சலுகை: முதல் 1,000 கணக்குகள் Founders — 90 இலவச Premium நாட்கள்." },
  howTitle: { en: "How ViralAI by FARFAZ runs", ta: "ViralAI by FARFAZ எப்படி இயங்குகிறது" },
  howBody: {
    en: "ViralAI by FARFAZ runs as a web app on the owner's own hosting (Vercel) with its database on Neon Postgres. You open it in any browser and sign in; your campaigns, designs, stores and orders are stored on the server under your own account. Inside the app, the planning figures and ad-performance numbers are SIMULATED guidance until real ad platforms are connected. Meta, Google and WhatsApp connections are REGISTERED — real ads run only from the owner's own connected accounts, with approval. Money for plans and orders always goes directly to the owner's or the store's own payment account — the platform never holds your money.",
    ta: "ViralAI by FARFAZ உரிமையாளரின் சொந்த hosting-இல் (Vercel) இணையச் செயலியாக இயங்குகிறது; அதன் database Neon Postgres-இல் உள்ளது. எந்த browser-இலும் திறந்து உள்நுழையுங்கள்; உங்கள் பிரச்சாரங்கள், designs, கடைகள், orders உங்கள் சொந்தக் கணக்கின் கீழ் server-இல் சேமிக்கப்படும். செயலிக்குள், உண்மையான விளம்பரத் தளங்கள் இணையும் வரை திட்டமிடல் புள்ளிவிவரங்களும் விளம்பரச் செயல்திறன் எண்களும் SIMULATED வழிகாட்டுதலே. Meta, Google, WhatsApp இணைப்புகள் REGISTERED — உண்மையான விளம்பரங்கள் உரிமையாளரின் சொந்த இணைக்கப்பட்ட கணக்குகளிலிருந்து, ஒப்புதலுடன் மட்டுமே இயங்கும். திட்டங்களுக்கும் orders-க்கும் பணம் எப்போதும் உரிமையாளரின் அல்லது கடையின் சொந்தக் கணக்குக்கு நேரடியாகச் செல்கிறது — தளம் உங்கள் பணத்தை ஒருபோதும் வைத்திருக்காது.",
  },
  worldTitle: { en: "One platform, every country", ta: "ஒரு தளம், ஒவ்வொரு நாடும்" },
  worldNote: { en: "No single QR works worldwide: India pays by UPI QR; Canada and the rest of the world pay by bank transfer (wire) to the owner's Canada account. Routes below are labelled per country.", ta: "ஒரே QR உலகம் முழுவதும் வேலை செய்யாது: இந்தியா UPI QR; கனடாவும் மற்ற உலகமும் உரிமையாளரின் கனடா கணக்குக்கு வங்கி மாற்றம் (wire). கீழே ஒவ்வொரு நாட்டுக்கும் வழி குறிக்கப்பட்டுள்ளது." },
  installTitle: { en: "Get the app — no store needed", ta: "App-ஐப் பெறுங்கள் — store தேவையில்லை" },
  installBody: {
    en: "iPhone: open in Safari → Share → Add to Home Screen. Android: open in Chrome → Install app. Computer: Chrome/Edge install icon in the address bar. This is an installable web app; a store app is a later step.",
    ta: "iPhone: Safari-இல் திறந்து → Share → Add to Home Screen. Android: Chrome-இல் திறந்து → Install app. கணினி: Chrome/Edge முகவரிப் பட்டியில் install ஐகான். இது நிறுவக்கூடிய இணையச் செயலி; store செயலி பிந்தைய படி.",
  },
  supportTitle: { en: "Support the Development", ta: "மேம்பாட்டை ஆதரியுங்கள்" },
  supportBody: { en: "Voluntary support goes to the owner's India UPI. Donations buy nothing and grant no Premium — they simply help build the platform.", ta: "தன்னார்வ ஆதரவு உரிமையாளரின் இந்தியா UPI-க்குச் செல்கிறது. நன்கொடைகள் எதையும் வாங்காது, Premium தராது — தளத்தைக் கட்ட உதவும்." },
  supportCta: { en: "Support inside the app", ta: "செயலிக்குள் ஆதரியுங்கள்" },
  realTitle: { en: "Real, simulated, registered — honestly labelled", ta: "உண்மை, போலி, பதிவு — நேர்மையாகப் பெயரிடப்பட்டது" },
};

export default function Landing() {
  const [lang] = useLang();
  const [data, setData] = useState<PublicData | null>(null);
  const [ref, setRef] = useState("");
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) setRef(r.toUpperCase());
    api("/api/public").then((d) => setData(d as unknown as PublicData)).catch(() => setData({ ready: false, cells: [], connections: [] }));
    api("/api/bootstrap").catch(() => {});
  }, []);
  const t = (k: keyof typeof L) => L[k][lang];
  return (
    <AppShell>
      <div className="hero">
        <div className="corewrap"><div className="core">🛰️</div></div>
        <h1>ViralAI by FARFAZ</h1>
        <p className="muted" style={{ fontSize: 18 }}>{t("heroSub")}</p>
        {ref && <p className="okbox">🎉 {t("invited")} <b>{ref}</b></p>}
        <p><span className="badge premium">🏆 {t("founders")}</span></p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn primary" href={ref ? `/auth?mode=signup&ref=${ref}` : "/auth?mode=signup"}>{t("cta")}</Link>
          <Link className="btn" href="/auth">{t("cta2")}</Link>
        </div>
      </div>

      <div className="grid">
        <div className="card"><h3>🎨 {lang === "ta" ? "Design நூலகம்" : "Design Library"}</h3><p className="muted">{lang === "ta" ? "நூற்றுக்கணக்கான வடிவங்கள் — கணக்கிடப்பட்ட எண்ணிக்கை செயலிக்குள்." : "Hundreds of designs across 20 premium families — the exact count is computed inside the app."}</p></div>
        <div className="card"><h3>🏪 {lang === "ta" ? "கடைகள் & Marketplace" : "Stores & Marketplace"}</h3><p className="muted">{lang === "ta" ? "உங்கள் சொந்தக் கடை, பொருட்கள், orders — பணம் நேரடியாக உங்களுக்கு." : "Your own store, products and orders — money goes directly to you."}</p></div>
        <div className="card"><h3>🛵 {lang === "ta" ? "Delivery கூட்டாளர்கள்" : "Delivery Partners"}</h3><p className="muted">{lang === "ta" ? "உள்ளூர் delivery-ஐ எடுத்து கடை நிர்ணயித்த கட்டணத்தை ஈட்டுங்கள்." : "Claim local deliveries and earn the store-set fee."}</p></div>
        <div className="card"><h3>📊 {lang === "ta" ? "விளம்பரத் திட்டமிடல்" : "Ad planning"}</h3><p className="muted">{lang === "ta" ? "பிரச்சாரங்கள் மற்றும் வழிகாட்டுதல் புள்ளிவிவரங்கள் — " : "Campaigns and guidance figures — "}<Badge kind="sim" lang={lang} /></p></div>
      </div>

      <div className="card">
        <h2>{t("howTitle")}</h2>
        <p>{t("howBody")}</p>
        <div className="row">
          <Badge kind="live" lang={lang} /><Badge kind="sim" lang={lang} /><Badge kind="reg" lang={lang} />
        </div>
        {data?.connections?.length ? (
          <table className="tbl"><tbody>
            {data.connections.map((c) => (
              <tr key={c.key}><td style={{ textTransform: "capitalize" }}>{c.key.replace("_", " ")}</td><td><Badge kind={c.status === "connected" ? "live" : "reg"} lang={lang} /></td><td className="muted">{lang === "ta" ? c.note_ta : c.note_en}</td></tr>
            ))}
          </tbody></table>
        ) : null}
      </div>

      <div className="card">
        <h2>{t("worldTitle")} 🌍</h2>
        <p className="muted">{t("worldNote")}</p>
        <div className="mapgrid">
          {(data?.cells?.length ? data.cells : COUNTRIES.map((c) => ({ code: c.code, country: c.en, countryTa: c.ta, activity: 0, paymentRoute: c.code === "IN" ? "upi_qr" : "wire", paymentStatus: c.code === "IN" ? "live" : "details_pending" }))).map((c) => (
            <div key={c.code} className="mapcell">
              <b>{lang === "ta" ? c.countryTa : c.country}</b>
              <div className="small muted">{c.paymentRoute === "upi_qr" ? "UPI QR" : lang === "ta" ? "வங்கி மாற்றம் (wire)" : "Bank transfer (wire)"} · {c.paymentStatus === "live" ? (lang === "ta" ? "நேரடி" : "LIVE") : (lang === "ta" ? "விவரங்கள் வருகின்றன" : "Details coming")}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid">
        <div className="card"><h3>📲 {t("installTitle")}</h3><p className="muted">{t("installBody")}</p></div>
        <div className="card"><h3>💛 {t("supportTitle")}</h3><p className="muted">{t("supportBody")}</p><Link className="btn gold" href="/auth?mode=signup">{t("supportCta")}</Link></div>
      </div>
    </AppShell>
  );
}
