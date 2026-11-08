"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { api, money } from "@/lib/client";

interface Order {
  id: number; store_name: string; items: Array<{ name: string; qty: number; priceMinor: number }>;
  total_minor: number; currency: string; status: string; pay_method: string;
  buyer_name: string; buyer_phone: string; buyer_address: string;
  buyer_marked_paid: boolean; seller_confirmed_payment: boolean; delivery_fee_minor: number; store_payment_link?: string;
}
interface Enquiry { id: number; store_name: string; message: string; created_at: string }
const STEPS = ["placed", "confirmed", "packed", "shipped", "picked_up", "out_for_delivery", "delivered"];

export default function Orders() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [asBuyer, setAsBuyer] = useState<Order[]>([]);
  const [asSeller, setAsSeller] = useState<Order[]>([]);
  const [sentEnq, setSentEnq] = useState<Enquiry[]>([]);
  async function refresh() {
    const d = await api("/api/orders").catch(() => ({ asBuyer: [], asSeller: [] }));
    setAsBuyer((d.asBuyer as Order[]) ?? []);
    setAsSeller((d.asSeller as Order[]) ?? []);
    const dash = await api("/api/store-dashboard").catch(() => ({} as Record<string, unknown>));
    setSentEnq((dash.enquiriesSent as Enquiry[]) ?? []);
  }
  useEffect(() => { refresh(); }, []);
  async function act(action: string, id: number, extra: Record<string, unknown> = {}) {
    await api("/api/orders", { method: "POST", body: JSON.stringify({ action, id, ...extra }) }).catch(() => {});
    refresh();
  }
  function Timeline({ o }: { o: Order }) {
    const idx = STEPS.indexOf(o.status);
    return (
      <div className="row small">
        {STEPS.map((s, i) => (
          <span key={s} className="badge" style={i <= idx && o.status !== "cancelled" ? { borderColor: "var(--green)", color: "#6ee7b7" } : undefined}>{s.replace(/_/g, " ")}</span>
        ))}
        {o.status === "cancelled" && <span className="badge sim">cancelled</span>}
      </div>
    );
  }
  return (
    <AppShell>
      <h1>📦 {ta ? "என் Order-கள்" : "My Orders"}</h1>
      <p className="muted small">{ta ? "நிலைப் படிகள் கடையால் புதுப்பிக்கப்படுபவை — GPS கண்காணிப்பு அல்ல." : "Status steps are updated by the store — this is not GPS tracking."}</p>
      <h2>{ta ? "நான் வாங்கியவை" : "Orders I placed"}</h2>
      {asBuyer.length === 0 && <p className="muted">{ta ? "இன்னும் order இல்லை." : "No orders yet."}</p>}
      {asBuyer.map((o) => (
        <div key={o.id} className="card">
          <b>{o.store_name}</b> — {money(o.total_minor, o.currency)} · {o.pay_method === "link" ? (ta ? "இணைப்பு/QR" : "Link/QR") : "COD"}
          <p className="small">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p>
          <Timeline o={o} />
          <div className="row" style={{ marginTop: 8 }}>
            {!o.buyer_marked_paid && o.pay_method === "link" && <button className="btn small primary" onClick={() => act("buyerPaid", o.id)}>{ta ? "பணம் செலுத்திவிட்டேன்" : "I have paid"}</button>}
            {o.buyer_marked_paid && <span className="badge">{ta ? "பணம் செலுத்தியதாகக் குறிக்கப்பட்டது" : "Marked paid"}</span>}
            {o.seller_confirmed_payment && <span className="badge live">{ta ? "கடை பணத்தை உறுதிப்படுத்தியது" : "Store confirmed payment"}</span>}
            {["placed", "confirmed"].includes(o.status) && <button className="btn small danger" onClick={() => act("buyerCancel", o.id)}>{ta ? "ரத்து செய்" : "Cancel"}</button>}
          </div>
        </div>
      ))}
      {sentEnq.length > 0 && (
        <>
          <h2>{ta ? "நான் கடைகளுக்கு அனுப்பிய செய்திகள்" : "Messages I sent to stores"}</h2>
          <p className="muted small">{ta ? "பதிவு செய்யப்பட்ட செய்திகள் — கடை அதன் Dashboard-இல் படிக்கும். நேரடி chat அல்ல." : "Recorded messages — the store reads them in its dashboard. Not live chat."}</p>
          {sentEnq.map((e) => (
            <div key={e.id} className="card">
              <b>{e.store_name}</b> <span className="small muted">· {new Date(e.created_at).toLocaleString(ta ? "ta-IN" : "en-GB")}</span>
              <p style={{ margin: "6px 0" }}>{e.message}</p>
            </div>
          ))}
        </>
      )}
      <h2>{ta ? "என் கடைக்கு வந்தவை" : "Orders to my stores"}</h2>
      {asSeller.length === 0 && <p className="muted">{ta ? "இன்னும் order இல்லை." : "No orders yet."}</p>}
      {asSeller.map((o) => (
        <div key={o.id} className="card">
          <b>{o.store_name}</b> — {money(o.total_minor, o.currency)} · {o.buyer_name} · {o.buyer_phone}
          <p className="small">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p>
          <p className="small muted">{o.buyer_address}</p>
          <Timeline o={o} />
          <div className="row" style={{ marginTop: 8 }}>
            {["confirmed", "packed", "shipped"].map((s) => (
              <button key={s} className="btn small" onClick={() => act("sellerStatus", o.id, { status: s })}>{s}</button>
            ))}
            {!o.seller_confirmed_payment && <button className="btn small primary" onClick={() => act("sellerConfirmPayment", o.id)}>{ta ? "பணம் வந்தது ✓" : "Payment received ✓"}</button>}
            <button className="btn small danger" onClick={() => act("sellerStatus", o.id, { status: "cancelled" })}>{ta ? "ரத்து" : "Cancel"}</button>
          </div>
        </div>
      ))}
    </AppShell>
  );
}
