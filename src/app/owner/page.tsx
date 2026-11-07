"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang, useMe } from "@/components/Shell";
import { Field, ErrBox } from "@/components/ui";
import { api, money } from "@/lib/client";

interface Member { id: number; name: string; email: string; country: string; city: string; is_owner: boolean; founder_number: number | null; suspended: boolean; position: { level: string; sourceLabel: string; premiumViaFreeDays: boolean; currentEndsAt: string | null } }
interface PayRow { id: number; user_name?: string; user_email?: string; plan: string; amount_minor: number; currency: string; method: string; status: string }
interface DonRow { id: number; donor_name: string; amount_minor: number; anonymous: boolean; source: string; created_at: string }
interface Cell { code: string; country: string; countryTa: string; members: number; stores: number; orders: number; paymentRoute: string; paymentStatus: string }

const BOARDS = ["members", "payments", "donations", "exceptions", "health", "map", "showcase", "guardrails", "audit", "connections"] as const;

export default function OwnerPage() {
  const [lang] = useLang();
  const { me, loading } = useMe();
  const ta = lang === "ta";
  const [board, setBoard] = useState<(typeof BOARDS)[number]>("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<PayRow[]>([]);
  const [decided, setDecided] = useState<PayRow[]>([]);
  const [totals, setTotals] = useState({ approvedTotalMinor: 0, approvedCount: 0 });
  const [donBoard, setDonBoard] = useState<{ donations: DonRow[]; pending: DonRow[]; totals: { confirmedCount: number; confirmedTotalMinor: number; pendingCount: number; todayCount: number; todayTotalMinor: number; qrViews: number } } | null>(null);
  const [exceptions, setExceptions] = useState<{ counts: Record<string, number>; errors: Array<{ id: number; source: string; message: string; retries: number; resolved: boolean }> } | null>(null);
  const [health, setHealth] = useState<{ checks: Array<{ name: string; ok: boolean; note: string }>; platform: { killSwitch: boolean; platformFeePercent: number } } | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [houseAds, setHouseAds] = useState<Array<{ id: number; slug: string; title_en: string; enabled: boolean }>>([]);
  const [guard, setGuard] = useState({ monthlyCapMinor: 0, dailyCapMinor: 0, notes: "" });
  const [auditRows, setAuditRows] = useState<Array<{ id: number; action: string; detail: string; created_at: string }>>([]);
  const [connections, setConnections] = useState<Array<{ key: string; status: string; note_en: string }>>([]);
  const [prices, setPrices] = useState({ monthly: "", yearly: "" });
  const [upi, setUpi] = useState({ address: "", payee: "" });
  const [countryForm, setCountryForm] = useState({ country: "Canada", bankName: "", swift: "", holderName: "", accountNumber: "", clearingCode: "", referenceNote: "", priceMonthly: "", priceYearly: "" });
  const [grantForm, setGrantForm] = useState<{ userId: number; level: string; preset: string; customDays: string; note: string }>({ userId: 0, level: "basic", preset: "1m", customDays: "", note: "" });
  const [manualDon, setManualDon] = useState({ name: "", amount: "" });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function load(b: string) {
    setErr("");
    try {
      if (b === "members") { const d = await api("/api/owner?board=members"); setMembers((d.members as Member[]) ?? []); }
      if (b === "payments") { const d = await api("/api/owner?board=payments"); setPending((d.pending as PayRow[]) ?? []); setDecided((d.decided as PayRow[]) ?? []); setTotals(d.totals as typeof totals); }
      if (b === "donations") { const d = await api("/api/donations"); setDonBoard(d.board as typeof donBoard); }
      if (b === "exceptions") { const d = await api("/api/owner?board=exceptions"); setExceptions(d as unknown as typeof exceptions); }
      if (b === "health") { const d = await api("/api/owner?board=health"); setHealth(d as unknown as typeof health); }
      if (b === "map") { const d = await api("/api/owner?board=map"); setCells((d.cells as Cell[]) ?? []); }
      if (b === "showcase") { const d = await api("/api/owner?board=houseads"); setHouseAds((d.houseAds as typeof houseAds) ?? []); }
      if (b === "guardrails") { const d = await api("/api/owner?board=guardrails"); const g = d.guardrails as { monthlyCapMinor?: number; dailyCapMinor?: number; notes?: string }; setGuard({ monthlyCapMinor: g.monthlyCapMinor ?? 0, dailyCapMinor: g.dailyCapMinor ?? 0, notes: g.notes ?? "" }); }
      if (b === "audit") { const d = await api("/api/owner?board=audit"); setAuditRows((d.audit as typeof auditRows) ?? []); }
      if (b === "connections") { const d = await api("/api/owner?board=connections"); setConnections((d.connections as typeof connections) ?? []); }
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  useEffect(() => { if (me?.is_owner) load(board); /* eslint-disable-next-line */ }, [board, me?.is_owner]);

  async function post(url: string, bodyObj: Record<string, unknown>, success: string) {
    setErr("");
    try { await api(url, { method: "POST", body: JSON.stringify(bodyObj) }); setMsg(success); load(board); }
    catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  if (loading) return <AppShell><p className="muted">…</p></AppShell>;
  if (!me?.is_owner) return (
    <AppShell>
      <h1>🔒 {ta ? "உரிமையாளர் மட்டும்" : "Owner only"}</h1>
      <p className="muted">{ta ? "இந்தப் பக்கம் கணக்கு உரிமையாளருக்கு மட்டுமே." : "This page is for the account owner only."}</p>
    </AppShell>
  );

  return (
    <AppShell>
      <h1>👑 {ta ? "உரிமையாளர் கட்டுப்பாடு" : "Owner Control"}</h1>
      <p className="muted small">{ta ? "பாதுகாப்புக் குறிப்பு: இந்தப் பலகைகள் சர்வரில் உரிமையாளர்-மட்டும் சோதனையால் பாதுகாக்கப்படுகின்றன. எந்த அமைப்பும் “hack-proof” என்று கூற முடியாது — கடவுச்சொற்கள் scrypt hash-ஆக சேமிக்கப்படுகின்றன, அமர்வுகள் hash செய்யப்பட்ட token-கள்." : "Security note: these boards are protected by a server-side owner-only check. No system can honestly be called “hack-proof” — passwords are stored as scrypt hashes and sessions as hashed tokens."}</p>
      <p className="muted small">{ta ? "ViralAI எப்படி இயங்குகிறது: Vercel-இல் Next.js app, Neon Postgres தரவு, Vercel Blob ஊடகம்; உங்கள் உலாவி + உள்நுழைவு மூலம் அணுகல்." : "How ViralAI runs: a Next.js app on Vercel, Neon Postgres data, Vercel Blob media; accessed from your browser with sign-in."}</p>
      <div className="row">
        {BOARDS.map((b) => <button key={b} className={`btn small ${board === b ? "primary" : ""}`} onClick={() => setBoard(b)}>{b}</button>)}
      </div>
      <ErrBox msg={err} />
      {msg && <p className="okbox">{msg}</p>}

      {board === "members" && (
        <>
          {members.map((m) => (
            <div key={m.id} className="card">
              <b>{m.name}</b> {m.is_owner && <span className="badge live">OWNER</span>} {m.founder_number ? <span className="badge free">Founder #{m.founder_number}</span> : null} {m.suspended && <span className="badge sim">SUSPENDED</span>}
              <p className="small muted">{m.email} · {m.city}, {m.country}</p>
              <p className="small">{ta ? "நிலை:" : "Position:"} <b>{m.position.level.toUpperCase()}</b> <span className="badge">{m.position.sourceLabel}</span>{m.position.premiumViaFreeDays && <span className="badge free" style={{ marginLeft: 6 }}>Premium (free days)</span>}</p>
              {!m.is_owner && (
                <div className="row">
                  {m.suspended
                    ? <button className="btn small" onClick={() => post("/api/owner", { action: "reactivate", userId: m.id }, ta ? "மீண்டும் செயல்படுத்தப்பட்டது" : "Reactivated")}>{ta ? "மீண்டும் செயல்படுத்து" : "Reactivate"}</button>
                    : <button className="btn small danger" onClick={() => post("/api/owner", { action: "suspend", userId: m.id }, ta ? "இடைநிறுத்தப்பட்டது" : "Suspended")}>{ta ? "இடைநிறுத்து" : "Suspend"}</button>}
                  <button className="btn small" onClick={() => setGrantForm({ ...grantForm, userId: m.id })}>{ta ? "அணுகல் வழங்கு" : "Grant access"}</button>
                </div>
              )}
            </div>
          ))}
          {grantForm.userId > 0 && (
            <div className="card" style={{ borderColor: "var(--gold)" }}>
              <h3>{ta ? "அணுகல் வழங்கு" : "Grant access"} — user #{grantForm.userId}</h3>
              <div className="row">
                <select style={{ width: "auto" }} value={grantForm.level} onChange={(e) => setGrantForm({ ...grantForm, level: e.target.value })}>
                  <option value="basic">Basic</option><option value="high">High</option>
                </select>
                <select style={{ width: "auto" }} value={grantForm.preset} onChange={(e) => setGrantForm({ ...grantForm, preset: e.target.value })}>
                  <option value="1m">1 month</option><option value="3m">3 months</option><option value="6m">6 months</option><option value="1y">1 year</option><option value="custom">Custom days</option>
                </select>
                {grantForm.preset === "custom" && <input style={{ width: 90 }} type="number" placeholder="days" value={grantForm.customDays} onChange={(e) => setGrantForm({ ...grantForm, customDays: e.target.value })} />}
                <input style={{ width: 200 }} placeholder={ta ? "தனிப்பட்ட குறிப்பு" : "Private note"} value={grantForm.note} onChange={(e) => setGrantForm({ ...grantForm, note: e.target.value })} />
                <button className="btn primary" onClick={() => post("/api/owner", { action: "grant", userId: grantForm.userId, level: grantForm.level, preset: grantForm.preset, customDays: Number(grantForm.customDays) || 0, note: grantForm.note }, ta ? "வழங்கப்பட்டது" : "Granted")}>{ta ? "வழங்கு" : "Grant"}</button>
              </div>
              <p className="small muted">{ta ? "முடிப்பது/நிறுத்துவது: உறுப்பினரின் grant பதிவை இங்கிருந்து முடிக்கலாம் — grant ID-ஐ audit பதிவில் காணலாம்." : "To end a grant early, use the grant ID from the audit log with the end-grant action below."}</p>
              <div className="row">
                <input style={{ width: 110 }} type="number" placeholder="Grant ID" id="endGrantId" />
                <button className="btn small danger" onClick={() => { const el = document.getElementById("endGrantId") as HTMLInputElement; post("/api/owner", { action: "endGrant", grantId: Number(el.value) || 0 }, ta ? "Grant முடிக்கப்பட்டது" : "Grant ended"); }}>{ta ? "Grant-ஐ முடி" : "End grant"}</button>
              </div>
            </div>
          )}
        </>
      )}

      {board === "payments" && (
        <>
          <div className="grid">
            <div className="card"><div className="kpi">{money(totals.approvedTotalMinor)}</div><p className="muted">{ta ? "ஒப்புதல் பெற்ற மொத்தம்" : "Approved total"}</p></div>
            <div className="card"><div className="kpi">{totals.approvedCount}</div><p className="muted">{ta ? "ஒப்புதல் பெற்ற பணங்கள்" : "Approved payments"}</p></div>
            <div className="card"><div className="kpi">{pending.length}</div><p className="muted">{ta ? "காத்திருப்பவை" : "Pending"}</p></div>
          </div>
          <h3>{ta ? "காத்திருக்கும் பணங்கள்" : "Pending payments"}</h3>
          {pending.map((p) => (
            <div key={p.id} className="card">
              <b>{p.user_name}</b> — {p.plan} · {money(p.amount_minor, p.currency)} · {p.method}
              <div className="row" style={{ marginTop: 6 }}>
                <button className="btn small primary" onClick={() => post("/api/payments", { action: "decide", id: p.id, approve: true }, ta ? "ஒப்புதல் — Premium செயல்பட்டது" : "Approved — Premium activated")}>{ta ? "ஒப்புதல்" : "Approve"}</button>
                <button className="btn small danger" onClick={() => post("/api/payments", { action: "decide", id: p.id, approve: false }, ta ? "நிராகரிக்கப்பட்டது" : "Rejected")}>{ta ? "நிராகரி" : "Reject"}</button>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="muted">{ta ? "காத்திருப்பவை இல்லை." : "Nothing pending."}</p>}
          <h3>{ta ? "விலைகள் & UPI" : "Prices & UPI"}</h3>
          <div className="card">
            <div className="row">
              <Field label={ta ? "மாதாந்திர விலை (₹)" : "Monthly price (₹)"}><input type="number" value={prices.monthly} onChange={(e) => setPrices({ ...prices, monthly: e.target.value })} /></Field>
              <Field label={ta ? "வருடாந்திர விலை (₹)" : "Yearly price (₹)"}><input type="number" value={prices.yearly} onChange={(e) => setPrices({ ...prices, yearly: e.target.value })} /></Field>
            </div>
            <button className="btn small primary" onClick={() => post("/api/payments", { action: "setPrices", monthlyMajor: Number(prices.monthly) || 0, yearlyMajor: Number(prices.yearly) || 0 }, ta ? "விலைகள் சேமிக்கப்பட்டன" : "Prices saved")}>{ta ? "விலைகளைச் சேமி" : "Save prices"}</button>
            <div className="row" style={{ marginTop: 10 }}>
              <Field label="UPI address"><input value={upi.address} onChange={(e) => setUpi({ ...upi, address: e.target.value })} placeholder="name@bank" /></Field>
              <Field label={ta ? "பெறுநர் பெயர்" : "Payee name"}><input value={upi.payee} onChange={(e) => setUpi({ ...upi, payee: e.target.value })} /></Field>
            </div>
            <button className="btn small" onClick={() => post("/api/payments", { action: "setUpi", address: upi.address, payee: upi.payee }, ta ? "UPI சேமிக்கப்பட்டது" : "UPI saved")}>{ta ? "UPI-ஐச் சேமி" : "Save UPI"}</button>
          </div>
          <h3>{ta ? "நாடு பண வழிகள்" : "Country payment routes"}</h3>
          <div className="card">
            <p className="small muted">{ta ? "கணக்கு எண்ணை நீங்களே இங்கு நிரப்புங்கள் — அது உங்கள் திரையில் மட்டுமே. நிலை “live” ஆவது கணக்கு எண் நிரப்பப்பட்ட பிறகே." : "Fill the account number yourself here — it lives only in your database. The route turns “live” only after you fill it."}</p>
            <div className="row">
              <input style={{ width: 130 }} value={countryForm.country} onChange={(e) => setCountryForm({ ...countryForm, country: e.target.value })} placeholder="Country" />
              <input style={{ width: 140 }} value={countryForm.bankName} onChange={(e) => setCountryForm({ ...countryForm, bankName: e.target.value })} placeholder="Bank name" />
              <input style={{ width: 110 }} value={countryForm.swift} onChange={(e) => setCountryForm({ ...countryForm, swift: e.target.value })} placeholder="SWIFT/BIC" />
              <input style={{ width: 150 }} value={countryForm.holderName} onChange={(e) => setCountryForm({ ...countryForm, holderName: e.target.value })} placeholder="Holder name" />
              <input style={{ width: 150 }} value={countryForm.accountNumber} onChange={(e) => setCountryForm({ ...countryForm, accountNumber: e.target.value })} placeholder="Account number" />
              <input style={{ width: 120 }} value={countryForm.clearingCode} onChange={(e) => setCountryForm({ ...countryForm, clearingCode: e.target.value })} placeholder="Clearing code" />
              <input style={{ width: 160 }} value={countryForm.referenceNote} onChange={(e) => setCountryForm({ ...countryForm, referenceNote: e.target.value })} placeholder="Reference note" />
              <button className="btn small primary" onClick={() => post("/api/payments", { action: "setCountry", ...countryForm }, ta ? "நாடு வழி சேமிக்கப்பட்டது" : "Country route saved")}>{ta ? "சேமி" : "Save"}</button>
            </div>
          </div>
          <h3>{ta ? "முடிவானவை" : "Decided"}</h3>
          {decided.map((p) => <div key={p.id} className="card"><b>{p.user_name}</b> — {p.plan} · {money(p.amount_minor, p.currency)} · <span className="badge">{p.status}</span></div>)}
        </>
      )}

      {board === "donations" && donBoard && (
        <>
          <div className="grid">
            <div className="card"><div className="kpi">{money(donBoard.totals.confirmedTotalMinor)}</div><p className="muted">{ta ? "உறுதியான நன்கொடைகள்" : "Confirmed donations"} ({donBoard.totals.confirmedCount})</p></div>
            <div className="card"><div className="kpi">{donBoard.totals.pendingCount}</div><p className="muted">{ta ? "காத்திருப்பவை" : "Pending"}</p></div>
            <div className="card"><div className="kpi">{money(donBoard.totals.todayTotalMinor)}</div><p className="muted">{ta ? "இன்று" : "Today"} ({donBoard.totals.todayCount})</p></div>
            <div className="card"><div className="kpi">{donBoard.totals.qrViews}</div><p className="muted">{ta ? "QR app-இல் காட்டப்பட்டது" : "QR shown in app"}</p></div>
          </div>
          <p className="small muted">{ta ? "app உங்கள் வங்கி/UPI app-இன் உள்ளே பார்க்க முடியாது — எண்ணிக்கைகள் பதிவு செய்யப்பட்ட வரிசைகளிலிருந்து மட்டுமே." : "The app cannot see inside your bank/UPI app — counts come only from recorded rows."}</p>
          {donBoard.pending.map((d) => (
            <div key={d.id} className="card">
              <b>{d.anonymous ? (ta ? "பெயர் தெரியாதவர்" : "Anonymous") : d.donor_name}</b> — {money(d.amount_minor)} · {d.source}
              <div className="row" style={{ marginTop: 6 }}>
                <button className="btn small primary" onClick={() => post("/api/donations", { action: "decide", id: d.id, confirm: true }, ta ? "உறுதிப்படுத்தப்பட்டது" : "Confirmed")}>{ta ? "உறுதிப்படுத்து" : "Confirm"}</button>
                <button className="btn small danger" onClick={() => post("/api/donations", { action: "decide", id: d.id, confirm: false }, ta ? "நிராகரிக்கப்பட்டது" : "Rejected")}>{ta ? "நிராகரி" : "Reject"}</button>
              </div>
            </div>
          ))}
          <div className="card">
            <h3>{ta ? "நேரடி நன்கொடையைச் சேர்" : "Add a direct donation"}</h3>
            <div className="row">
              <input style={{ width: 180 }} placeholder={ta ? "பெயர்" : "Name"} value={manualDon.name} onChange={(e) => setManualDon({ ...manualDon, name: e.target.value })} />
              <input style={{ width: 110 }} type="number" placeholder="₹" value={manualDon.amount} onChange={(e) => setManualDon({ ...manualDon, amount: e.target.value })} />
              <button className="btn small primary" onClick={() => post("/api/donations", { action: "manualAdd", donorName: manualDon.name, amountMajor: Number(manualDon.amount) || 0 }, ta ? "சேர்க்கப்பட்டது" : "Added")}>{ta ? "சேர்" : "Add"}</button>
            </div>
            <p className="small muted">{ta ? "கையால் சேர்க்கப்பட்டவை “Owner-added” எனக் குறிக்கப்படும்; நன்றிச் சுவரில் வராது." : "Manual entries are marked “Owner-added” and never appear on the thank-you wall."}</p>
          </div>
        </>
      )}

      {board === "exceptions" && exceptions && (
        <>
          <div className="grid">
            {Object.entries(exceptions.counts).map(([k, v]) => (
              <div key={k} className="card"><div className="kpi">{v}</div><p className="muted">{k}</p></div>
            ))}
          </div>
          <h3>{ta ? "பிழை Inbox" : "Error Inbox"}</h3>
          {exceptions.errors.map((e) => (
            <div key={e.id} className="card">
              <b>{e.source}</b> — <span className="small">{e.message}</span> {e.resolved && <span className="badge live">resolved</span>}
              {!e.resolved && (
                <div className="row" style={{ marginTop: 6 }}>
                  <button className="btn small" onClick={() => post("/api/owner", { action: "retryError", errorId: e.id }, `${ta ? "மீண்டும் முயற்சி" : "Retry"} #${e.retries + 1}`)}>{ta ? "மீண்டும் முயற்சி" : "Retry"} ({e.retries})</button>
                  <button className="btn small" onClick={() => post("/api/owner", { action: "resolveError", errorId: e.id }, ta ? "தீர்க்கப்பட்டது" : "Resolved")}>{ta ? "தீர்ந்ததாகக் குறி" : "Mark resolved"}</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {board === "health" && health && (
        <>
          {health.checks.map((c, i) => (
            <div key={i} className="card"><b>{c.ok ? "✅" : "⚠️"} {c.name}</b><p className="small muted">{c.note}</p></div>
          ))}
          <div className="card">
            <h3>🛑 Kill Switch</h3>
            <p className="small">{ta ? "தற்போது:" : "Currently:"} <b>{health.platform.killSwitch ? "ON — campaign activation paused platform-wide" : "OFF"}</b></p>
            <button className={`btn ${health.platform.killSwitch ? "" : "danger"}`} onClick={() => post("/api/owner", { action: "killSwitch", on: !health.platform.killSwitch }, ta ? "Kill switch புதுப்பிக்கப்பட்டது" : "Kill switch updated")}>
              {health.platform.killSwitch ? (ta ? "மீண்டும் இயக்கு" : "Turn OFF (resume)") : (ta ? "எல்லாவற்றையும் நிறுத்து" : "STOP everything")}
            </button>
          </div>
          <div className="card">
            <h3>{ta ? "Delivery தளக் கட்டணம் %" : "Delivery platform fee %"}</h3>
            <div className="row">
              <input style={{ width: 90 }} type="number" defaultValue={health.platform.platformFeePercent} id="feePct" />
              <button className="btn small" onClick={() => { const el = document.getElementById("feePct") as HTMLInputElement; post("/api/owner", { action: "platformFee", percent: Number(el.value) || 0 }, ta ? "கட்டணம் சேமிக்கப்பட்டது" : "Fee saved"); }}>{ta ? "சேமி" : "Save"}</button>
            </div>
          </div>
        </>
      )}

      {board === "map" && (
        <>
          <h3>🌍 {ta ? "உலக வரைபடம் — உண்மையான எண்ணிக்கைகள்" : "World Map — real counts"}</h3>
          <div className="mapgrid">
            {cells.map((c) => (
              <div key={c.code} className={`mapcell ${c.members + c.stores > 0 ? "hot" : ""}`}>
                <b>{ta ? c.countryTa : c.country}</b>
                <div className="small">👥 {c.members} · 🏪 {c.stores} · 📦 {c.orders}</div>
                <div className="small muted">{c.paymentRoute === "upi_qr" ? "UPI QR" : "Wire"} · {c.paymentStatus}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {board === "showcase" && (
        <>
          <h3>{ta ? "Showcase மேலாளர்" : "Showcase manager"}</h3>
          {houseAds.map((a) => (
            <div key={a.id} className="card row" style={{ justifyContent: "space-between" }}>
              <span>{a.title_en} <span className="badge">{a.enabled ? "ON" : "OFF"}</span></span>
              <button className="btn small" onClick={() => post("/api/showcase", { action: "setEnabled", id: a.id, enabled: !a.enabled }, ta ? "புதுப்பிக்கப்பட்டது" : "Updated")}>{a.enabled ? (ta ? "முடக்கு" : "Disable") : (ta ? "இயக்கு" : "Enable")}</button>
            </div>
          ))}
        </>
      )}

      {board === "guardrails" && (
        <div className="card">
          <h3>🛡️ {ta ? "Master Guardrails" : "Master Guardrails"}</h3>
          <p className="small muted">{ta ? "Autopilot தானாக வெளியிடுவது நிரந்தரமாக OFF — இதை இயக்க முடியாது. வரம்புகள் வழிகாட்டுதலுக்கு மட்டுமே; உண்மையான செலவு எதுவும் இல்லை." : "Autopilot auto-publish is permanently OFF — it cannot be switched on. Caps are guidance only; nothing actually spends."}</p>
          <Field label={ta ? "மாத வரம்பு (சிறு அலகு)" : "Monthly cap (minor units)"}><input type="number" value={guard.monthlyCapMinor} onChange={(e) => setGuard({ ...guard, monthlyCapMinor: Number(e.target.value) || 0 })} /></Field>
          <Field label={ta ? "தினசரி வரம்பு (சிறு அலகு)" : "Daily cap (minor units)"}><input type="number" value={guard.dailyCapMinor} onChange={(e) => setGuard({ ...guard, dailyCapMinor: Number(e.target.value) || 0 })} /></Field>
          <Field label={ta ? "குறிப்புகள்" : "Notes"}><input value={guard.notes} onChange={(e) => setGuard({ ...guard, notes: e.target.value })} /></Field>
          <button className="btn primary" onClick={() => post("/api/owner", { action: "guardrails", monthlyCapMinor: guard.monthlyCapMinor, dailyCapMinor: guard.dailyCapMinor, notes: guard.notes }, ta ? "Guardrails சேமிக்கப்பட்டன" : "Guardrails saved")}>{ta ? "சேமி" : "Save"}</button>
        </div>
      )}

      {board === "audit" && auditRows.map((a) => (
        <div key={a.id} className="card"><b>{a.action}</b> <span className="small muted">{a.detail} · {new Date(a.created_at).toLocaleString()}</span></div>
      ))}

      {board === "connections" && (
        <>
          <h3>{ta ? "API இணைப்புகள்" : "API connections"}</h3>
          {connections.map((c) => (
            <div key={c.key} className="card"><b>{c.key}</b> <span className="badge reg">{c.status.toUpperCase()}</span><p className="small muted">{c.note_en}</p></div>
          ))}
          <p className="small muted">{ta ? "உண்மையான விளம்பரங்கள் உரிமையாளர் தனது சொந்த Meta/Google கணக்குகளை இணைக்கும்போது மட்டுமே." : "Real ads happen only when the owner connects his own Meta/Google accounts."}</p>
        </>
      )}
    </AppShell>
  );
}
