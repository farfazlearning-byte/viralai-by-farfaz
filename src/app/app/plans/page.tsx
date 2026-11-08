"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang, useMe } from "@/components/Shell";
import { Field, ErrBox } from "@/components/ui";
import { api, money, clientKey } from "@/lib/client";

interface Plan { key: string; labelEn: string; labelTa: string; priceMinor: number | null; currency: string; qrPayload: string | null; qrSvg: string | null }
interface Route { country: string; route: string; status: string; currency: string; wireFields: Record<string, string> | null; priceMonthlyMinor: number | null; priceYearlyMinor: number | null }
interface Payment { id: number; plan: string; amount_minor: number; currency: string; method: string; status: string; created_at: string }

export default function Plans() {
  const [lang] = useLang();
  const { me } = useMe();
  const ta = lang === "ta";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [position, setPosition] = useState<{ level: string; sourceLabel: string; premiumViaFreeDays: boolean; currentEndsAt: string | null }>({ level: "free", sourceLabel: "FREE", premiumViaFreeDays: false, currentEndsAt: null });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [wireAmount, setWireAmount] = useState("");
  const [key] = useState(clientKey());
  const [donateAmt, setDonateAmt] = useState("100");
  const [donorName, setDonorName] = useState("");
  const [donateQr, setDonateQr] = useState("");
  const [wall, setWall] = useState<Array<{ name: string; amount_minor: number }>>([]);
  const [wallOptIn, setWallOptIn] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  // The /api/payments contract is: plans as an OBJECT keyed by plan
  // ({monthly:{priceMinor,payload,svg}, yearly:{...}}), country rows under
  // `countries`, own payments under `mine`, and NO position (that lives in
  // /api/account as {tier, viaFreeDays, premiumFreeUntil}). This page used
  // to cast the plans object to an array and call .map() on it — a
  // TypeError the moment real data loaded, which froze navigation. Map the
  // real contract here, and let failures surface in the ErrBox instead of
  // being swallowed into empty state.
  async function refresh() {
    try {
      const d = await api("/api/payments");
      const rawPlans = (d.plans as Record<string, { priceMinor: number | null; payload: string | null; svg: string | null }>) ?? {};
      const defs = [
        { key: "monthly", labelEn: "Monthly · Basic (30 days)", labelTa: "மாதாந்திர · Basic (30 நாட்கள்)" },
        { key: "yearly", labelEn: "Yearly · High (365 days)", labelTa: "வருடாந்திர · High (365 நாட்கள்)" },
      ];
      setPlans(defs.map((def) => {
        const rp = rawPlans[def.key];
        return { ...def, priceMinor: rp?.priceMinor ?? null, currency: (d.currency as string) ?? "INR", qrPayload: rp?.payload ?? null, qrSvg: rp?.svg ?? null };
      }));
      const rawCountries = (d.countries as Array<Record<string, unknown>>) ?? [];
      setRoutes(rawCountries.map((c) => ({
        country: String(c.country ?? ""),
        route: String(c.route ?? "wire"),
        status: String(c.status ?? "details_pending"),
        currency: String(c.currency ?? ""),
        wireFields: c.wire_account_number
          ? { bankName: String(c.wire_bank_name ?? ""), swift: String(c.wire_swift ?? ""), holderName: String(c.wire_holder_name ?? ""), accountNumber: String(c.wire_account_number ?? ""), clearingCode: String(c.wire_clearing_code ?? ""), referenceNote: String(c.wire_reference_note ?? "") }
          : null,
        priceMonthlyMinor: null,
        priceYearlyMinor: null,
      })));
      setPayments((d.mine as Payment[]) ?? []);
      const acc = await api("/api/account").catch(() => null);
      const p = acc?.position as { tier: string; sourceLabel: string; viaFreeDays: boolean; premiumFreeUntil: string | null } | undefined;
      if (p) setPosition({ level: p.tier, sourceLabel: p.sourceLabel, premiumViaFreeDays: p.viaFreeDays, currentEndsAt: p.premiumFreeUntil });
      const don = await api(`/api/donations?amount=${encodeURIComponent(donateAmt || "100")}`);
      setDonateQr((don.svg as string) ?? "");
      setWall(((don.wall as Array<{ donor_name: string; amount_minor: number }>) ?? []).map((w) => ({ name: w.donor_name, amount_minor: w.amount_minor })));
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function payUpi(planKey: string) {
    setErr("");
    try {
      await api("/api/payments", { method: "POST", body: JSON.stringify({ action: "pay", plan: planKey, method: "upi", clientKey: key }) });
      setMsg(ta ? "பதிவானது — உரிமையாளர் உறுதிப்படுத்தியதும் Premium செயல்படும்." : "Recorded — Premium activates when the owner confirms.");
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  async function payWire(planKey: string, route: Route) {
    setErr("");
    try {
      await api("/api/payments", { method: "POST", body: JSON.stringify({ action: "pay", plan: planKey, method: "wire", country: route.country, amountMajor: Number(wireAmount) || 0, clientKey: key }) });
      setMsg(ta ? "பதிவானது — உரிமையாளர் உறுதிப்படுத்துவார்." : "Recorded — the owner will confirm.");
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  async function donate() {
    setErr("");
    try {
      await api("/api/donations", { method: "POST", body: JSON.stringify({ action: "record", amountMajor: Number(donateAmt) || 0, donorName, anonymous, wallOptIn }) });
      setMsg(ta ? "நன்றி! உங்கள் நன்கொடை பதிவானது — உரிமையாளர் உறுதிப்படுத்துவார்." : "Thank you! Your donation is recorded — the owner will confirm it.");
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  const myRoute = routes.find((r) => me && r.country === me.country) ?? routes[0];
  return (
    <AppShell>
      <h1>💎 {ta ? "திட்டங்கள்" : "Plans"}</h1>
      <div className="card">
        <p>{ta ? "உங்கள் தற்போதைய நிலை:" : "Your current position:"} <b>{position.level.toUpperCase()}</b> <span className="badge">{position.sourceLabel}</span>
        {position.premiumViaFreeDays && <span className="badge free" style={{ marginLeft: 6 }}>{ta ? "Premium (இலவச நாட்கள்)" : "Premium (free days)"}</span>}
        {position.currentEndsAt && <span className="muted small"> · {ta ? "முடிவு:" : "Ends:"} {new Date(position.currentEndsAt).toLocaleDateString()}</span>}</p>
      </div>
      <ErrBox msg={err} />
      {msg && <p className="okbox">{msg}</p>}
      <div className="grid">
        {plans.map((p) => (
          <div key={p.key} className="card">
            <h3>{ta ? p.labelTa : p.labelEn}</h3>
            {p.priceMinor === null ? (
              <p className="muted">{ta ? "விலை விரைவில் உரிமையாளரால் நிர்ணயிக்கப்படும்" : "Price set by owner soon"}</p>
            ) : (
              <>
                <div className="kpi">{money(p.priceMinor, p.currency)}</div>
                {p.qrSvg ? (
                  <>
                    <div className="qrbox" dangerouslySetInnerHTML={{ __html: p.qrSvg }} />
                    <p className="small" style={{ wordBreak: "break-all" }}>{p.qrPayload}</p>
                    <p className="small muted">{ta ? "பணம் நேரடியாக உரிமையாளரின் கணக்குக்குச் செல்கிறது — app பணத்தை வைத்திருக்காது." : "Money goes directly to the owner's account — the app never holds it."}</p>
                    <button className="btn primary" onClick={() => payUpi(p.key)}>{ta ? "செலுத்திவிட்டேன்" : "I have paid"}</button>
                  </>
                ) : <p className="muted">{ta ? "பணம் விரைவில் திறக்கும்" : "Payments open soon"}</p>}
              </>
            )}
          </div>
        ))}
      </div>

      {myRoute && myRoute.route === "wire" && (
        <div className="card">
          <h3>🏦 {ta ? "வங்கி மாற்றம் (wire)" : "Bank transfer (wire)"} — {myRoute.country}</h3>
          {myRoute.status !== "live" ? (
            <p className="muted">{ta ? "விவரங்கள் உரிமையாளரால் சேர்க்கப்படுகின்றன" : "Wire details are being added by the owner"}</p>
          ) : myRoute.wireFields ? (
            <>
              <p className="small">{ta ? "வங்கி:" : "Bank:"} {myRoute.wireFields.bankName} · SWIFT: {myRoute.wireFields.swift} · {ta ? "பெயர்:" : "Name:"} {myRoute.wireFields.holderName}<br />{ta ? "கணக்கு:" : "Account:"} {myRoute.wireFields.accountNumber} · {ta ? "குறியீடு:" : "Code:"} {myRoute.wireFields.clearingCode}<br />{ta ? "குறிப்பு:" : "Reference:"} {myRoute.wireFields.referenceNote}</p>
              <Field label={ta ? "அனுப்பிய தொகை" : "Amount sent"}><input type="number" value={wireAmount} onChange={(e) => setWireAmount(e.target.value)} /></Field>
              <div className="row">
                <button className="btn" onClick={() => payWire("monthly", myRoute)}>{ta ? "மாதாந்திர — அனுப்பிவிட்டேன்" : "Monthly — I have sent it"}</button>
                <button className="btn" onClick={() => payWire("yearly", myRoute)}>{ta ? "வருடாந்திர — அனுப்பிவிட்டேன்" : "Yearly — I have sent it"}</button>
              </div>
            </>
          ) : null}
        </div>
      )}

      <h2>{ta ? "என் பணப் பதிவுகள்" : "My payment records"}</h2>
      {payments.length === 0 && <p className="muted">{ta ? "இன்னும் இல்லை." : "None yet."}</p>}
      {payments.map((p) => (
        <div key={p.id} className="card"><b>{p.plan}</b> — {money(p.amount_minor, p.currency)} · {p.method} · <span className="badge">{p.status}</span> <span className="muted small">{new Date(p.created_at).toLocaleString()}</span></div>
      ))}

      <div className="card" style={{ borderColor: "var(--gold)" }}>
        <h3>💛 {ta ? "மேம்பாட்டுக்கு ஆதரவு" : "Support the Development"}</h3>
        <p className="small muted">{ta ? "தன்னார்வ நன்கொடை — எதையும் வாங்காது, Premium தராது, வரி/தொண்டு உரிமை இல்லை." : "A voluntary donation — it buys nothing, grants no Premium, and carries no tax/charity claim."}</p>
        <Field label={ta ? "தொகை (₹)" : "Amount (₹)"}><input type="number" value={donateAmt} onChange={(e) => setDonateAmt(e.target.value)} /></Field>
        {donateQr && <div className="qrbox" dangerouslySetInnerHTML={{ __html: donateQr }} />}
        <button className="btn small" onClick={refresh}>{ta ? "QR-ஐப் புதுப்பி" : "Refresh QR"}</button>
        <Field label={ta ? "உங்கள் பெயர் (விருப்பம்)" : "Your name (optional)"}><input value={donorName} onChange={(e) => setDonorName(e.target.value)} /></Field>
        <div className="row">
          <label className="small"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} style={{ width: "auto" }} /> {ta ? "பெயர் தெரியாமல்" : "Anonymous"}</label>
          <label className="small"><input type="checkbox" checked={wallOptIn} onChange={(e) => setWallOptIn(e.target.checked)} style={{ width: "auto" }} /> {ta ? "நன்றிச் சுவரில் என் பெயரைக் காட்டு" : "Show my name on the thank-you wall"}</label>
        </div>
        <button className="btn primary" onClick={donate}>{ta ? "நன்கொடை அளித்துவிட்டேன்" : "I have donated"}</button>
        {wall.length > 0 && (
          <>
            <h4>🙏 {ta ? "நன்றிச் சுவர்" : "Thank-you wall"}</h4>
            {wall.map((w, i) => <p key={i} className="small">{w.name} — {money(w.amount_minor)}</p>)}
          </>
        )}
      </div>
    </AppShell>
  );
}
