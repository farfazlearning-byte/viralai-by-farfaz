"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { Field, ErrBox } from "@/components/ui";
import { api, money } from "@/lib/client";

interface Avail { id: number; store_name: string; store_city: string; total_minor: number; delivery_fee_minor: number; currency: string; status: string }
interface Mine { id: number; store_name: string; status: string; delivery_fee_minor: number; currency: string; buyer_name: string; buyer_phone: string; buyer_address: string }
interface Partner { id: number; name: string; city: string }

export default function Delivery() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [partner, setPartner] = useState<Partner | null>(null);
  const [available, setAvailable] = useState<Avail[]>([]);
  const [mine, setMine] = useState<Mine[]>([]);
  const [stats, setStats] = useState({ completed: 0, feesEarnedMinor: 0 });
  const [feePct, setFeePct] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", areas: "", vehicle: "", phone: "" });
  const [err, setErr] = useState("");

  async function refresh() {
    const d = await api("/api/delivery").catch(() => ({}) as Record<string, unknown>);
    setPartner((d.partner as Partner) ?? null);
    setAvailable((d.available as Avail[]) ?? []);
    setMine((d.mine as Mine[]) ?? []);
    setStats((d.stats as typeof stats) ?? { completed: 0, feesEarnedMinor: 0 });
    setFeePct(Number(d.platformFeePercent ?? 0));
    setLoaded(true);
  }
  useEffect(() => { refresh(); }, []);

  async function register() {
    setErr("");
    try {
      await api("/api/delivery", { method: "POST", body: JSON.stringify({ action: "register", ...form }) });
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  async function act(action: string, orderId: number, extra: Record<string, unknown> = {}) {
    setErr("");
    try {
      await api("/api/delivery", { method: "POST", body: JSON.stringify({ action, orderId, ...extra }) });
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  return (
    <AppShell>
      <h1>🛵 {ta ? "Delivery கூட்டாளர்" : "Delivery Partner"}</h1>
      <ErrBox msg={err} />
      {loaded && !partner && (
        <div className="card">
          <h3>{ta ? "Delivery கூட்டாளராகப் பதிவு செய்யுங்கள்" : "Register as a Delivery Partner"}</h3>
          <p className="muted small">{ta ? "Basic அல்லது High நிலை தேவை. உங்கள் நகரத்தில் உள்ள delivery-களை எடுத்து, கடை நிர்ணயித்த கட்டணத்தை ஈட்டுங்கள்." : "A Basic or High position is required. Claim deliveries in your city and earn the store-set fee."}</p>
          <Field label={ta ? "பெயர்" : "Name"}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={ta ? "நகரம்" : "City"}><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label={ta ? "பகுதிகள்" : "Areas covered"}><input value={form.areas} onChange={(e) => setForm({ ...form, areas: e.target.value })} /></Field>
          <Field label={ta ? "வாகனம்" : "Vehicle"}><input value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} /></Field>
          <Field label={ta ? "தொலைபேசி" : "Phone"}><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <button className="btn primary" onClick={register}>{ta ? "பதிவு செய்" : "Register"}</button>
        </div>
      )}
      {partner && (
        <>
          <div className="grid">
            <div className="card"><div className="kpi">{stats.completed}</div><p className="muted">{ta ? "முடித்த delivery-கள்" : "Deliveries completed"}</p></div>
            <div className="card"><div className="kpi">{money(stats.feesEarnedMinor)}</div><p className="muted">{ta ? "ஈட்டிய கட்டணங்கள்" : "Fees earned"}</p></div>
            <div className="card"><div className="kpi">{feePct}%</div><p className="muted">{ta ? "தளக் கட்டணம்" : "Platform fee"}</p></div>
          </div>
          <h2>{ta ? `${partner.city}-இல் கிடைக்கும் delivery-கள்` : `Available in ${partner.city}`}</h2>
          <p className="muted small">{ta ? "வாங்குபவரின் விவரங்கள் நீங்கள் எடுக்கும் வரை மறைக்கப்படும்." : "Buyer details stay hidden until you claim a delivery."}</p>
          {available.length === 0 && <p className="muted">{ta ? "இப்போது எதுவும் இல்லை." : "Nothing available right now."}</p>}
          {available.map((o) => (
            <div key={o.id} className="card">
              <b>{o.store_name}</b> — {ta ? "கட்டணம்" : "Fee"}: <b>{money(o.delivery_fee_minor, o.currency)}</b> · {ta ? "Order மதிப்பு" : "Order value"}: {money(o.total_minor, o.currency)}
              <p className="small muted">{ta ? "வாங்குபவர்:" : "Buyer:"} ••• ({ta ? "எடுத்த பிறகு தெரியும்" : "revealed after claim"})</p>
              <button className="btn small primary" onClick={() => act("claim", o.id)}>{ta ? "இதை எடு" : "Claim this delivery"}</button>
            </div>
          ))}
          <h2>{ta ? "என் delivery-கள்" : "My deliveries"}</h2>
          {mine.map((o) => (
            <div key={o.id} className="card">
              <b>{o.store_name}</b> — {o.status.replace(/_/g, " ")} · {money(o.delivery_fee_minor, o.currency)}
              <p className="small">{o.buyer_name} · {o.buyer_phone}<br />{o.buyer_address}</p>
              <div className="row">
                {o.status !== "delivered" && ["picked_up", "out_for_delivery", "delivered"].filter((s) => s !== o.status).map((s) => (
                  <button key={s} className="btn small" onClick={() => act("step", o.id, { step: s })}>{s.replace(/_/g, " ")}</button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </AppShell>
  );
}
