"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, useLang } from "@/components/Shell";
import { Field, ErrBox } from "@/components/ui";
import { api, money } from "@/lib/client";

interface Store {
  id: number; name: string; category: string; country: string; city: string;
  cod_enabled: boolean; delivery_fee_minor: number; currency: string; suspended: boolean;
}
interface Product {
  id: number; store_id: number; name: string; price_minor: number; currency: string;
  description_en: string; description_ta: string; stock: number; in_stock: boolean;
  active: boolean; photo_url: string | null;
}
interface Order {
  id: number; store_name: string; items: Array<{ name: string; qty: number; priceMinor: number }>;
  total_minor: number; currency: string; status: string; pay_method: string;
  buyer_name: string; buyer_phone: string; buyer_address: string;
  buyer_marked_paid: boolean; seller_confirmed_payment: boolean; delivery_fee_minor: number;
}
interface TotalRow { currency: string; status: string; n: number; total_minor: string }
interface Enquiry { id: number; store_name: string; buyer_name?: string; message: string; created_at: string }
interface DeliveryRow {
  id: number; store_name: string; status: string; delivery_fee_minor: number; currency: string;
  buyer_name: string; buyer_phone: string; buyer_address: string;
}
interface Partner { id: number; name: string; city: string; suspended: boolean }

const STEPS = ["placed", "confirmed", "packed", "shipped", "picked_up", "out_for_delivery", "delivered"];

function Timeline({ o }: { o: Order }) {
  const idx = STEPS.indexOf(o.status);
  return (
    <div className="row small">
      {STEPS.map((s, i) => (
        <span key={s} className="badge" style={i <= idx && o.status !== "cancelled" ? { borderColor: "var(--green)", color: "#6ee7b7" } : undefined}>
          {s.replace(/_/g, " ")}
        </span>
      ))}
      {o.status === "cancelled" && <span className="badge sim">cancelled</span>}
    </div>
  );
}

function ProductCard({ p, ta, onSaved }: { p: Product; ta: boolean; onSaved: () => void }) {
  const [price, setPrice] = useState(String(p.price_minor / 100));
  const [stock, setStock] = useState(String(p.stock));
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  async function save() {
    setErr("");
    try {
      await api("/api/stores", {
        method: "POST",
        body: JSON.stringify({
          action: "updateProduct", id: p.id, name: p.name,
          priceMajor: Number(price) || 0,
          descriptionEn: p.description_en, descriptionTa: p.description_ta,
          stock: Number(stock) || 0, inStock: p.in_stock, active: p.active,
        }),
      });
      setSaved(true);
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  return (
    <div className="card holo" style={{ margin: 0 }}>
      {p.photo_url
        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.photo_url} alt="" style={{ width: "100%", borderRadius: 10 }} />
        : <div style={{ fontSize: 34 }}>🛍️</div>}
      <p style={{ margin: "6px 0" }}>{p.photo_url
        ? <span className="chip own">{ta ? "கடையின் சொந்தப் படம் · Shop's own photo" : "Shop's own photo"}</span>
        : <span className="chip builtin">{ta ? "உள்ளமை வரைபடம் · Built-in illustration" : "Built-in illustration"}</span>}
        {!p.active && <span className="badge sim">{ta ? "மறைக்கப்பட்டது" : "hidden"}</span>}
      </p>
      <b>{p.name}</b>
      <p className="small">{money(p.price_minor, p.currency)} · {ta ? "இருப்பு" : "Stock"}: {p.stock}
        {p.stock <= 3 && <span className="badge sim" style={{ marginLeft: 6 }}>{ta ? "குறைந்த இருப்பு" : "Low stock"}</span>}
      </p>
      <ErrBox msg={err} />
      <div className="row">
        <span style={{ flex: 1 }}>
          <Field label={ta ? "விலை" : "Price"}><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        </span>
        <span style={{ flex: 1 }}>
          <Field label={ta ? "இருப்பு" : "Stock"}><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></Field>
        </span>
      </div>
      <button className="btn small primary" onClick={save}>{ta ? "சேமி" : "Save"}</button>
      {saved && <span className="small" style={{ marginLeft: 8 }}>✓</span>}
    </div>
  );
}

export default function StoreDashboard() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totals, setTotals] = useState<TotalRow[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [deliveryStats, setDeliveryStats] = useState({ completed: 0, feesEarnedMinor: 0 });
  const [enqIn, setEnqIn] = useState<Enquiry[]>([]);
  const [enqOut, setEnqOut] = useState<Enquiry[]>([]);
  const [enqReady, setEnqReady] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");

  async function refresh() {
    const d = await api("/api/store-dashboard").catch(() => ({} as Record<string, unknown>));
    setStores((d.stores as Store[]) ?? []);
    setProducts((d.products as Product[]) ?? []);
    setOrders((d.orders as Order[]) ?? []);
    setTotals((d.totals as TotalRow[]) ?? []);
    setPartner((d.partner as Partner) ?? null);
    setDeliveries((d.deliveries as DeliveryRow[]) ?? []);
    setDeliveryStats((d.deliveryStats as typeof deliveryStats) ?? { completed: 0, feesEarnedMinor: 0 });
    setEnqIn((d.enquiriesReceived as Enquiry[]) ?? []);
    setEnqOut((d.enquiriesSent as Enquiry[]) ?? []);
    setEnqReady(d.enquiriesReady !== false);
    setLoaded(true);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function orderAct(action: string, id: number, extra: Record<string, unknown> = {}) {
    setErr("");
    try {
      await api("/api/orders", { method: "POST", body: JSON.stringify({ action, id, ...extra }) });
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  async function deliveryAct(orderId: number, step: string) {
    setErr("");
    try {
      await api("/api/delivery", { method: "POST", body: JSON.stringify({ action: "step", orderId, step }) });
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  const lowStock = products.filter((p) => p.active && p.stock <= 3);
  const salesByCurrency: Record<string, number> = {};
  for (const t of totals) {
    if (t.status === "cancelled") continue;
    salesByCurrency[t.currency] = (salesByCurrency[t.currency] ?? 0) + Number(t.total_minor);
  }
  const fmtDate = (s: string) => new Date(s).toLocaleString(ta ? "ta-IN" : "en-GB");

  return (
    <AppShell>
      <h1>🏪 {ta ? "என் கடை Dashboard" : "My Store Dashboard"}</h1>
      <p className="muted">{ta
        ? "உங்கள் கடைகள், பொருட்கள், வந்த order-கள், விற்பனை மொத்தம், delivery வேலை, வாங்குபவர்களின் செய்திகள் — எல்லாம் உண்மையான பதிவுகளிலிருந்து மட்டும்."
        : "Your stores, products, orders received, sales totals, delivery work and buyer messages — from real stored records only."}</p>
      <ErrBox msg={err} />

      {loaded && stores.length === 0 && (
        <div className="card">
          <h3>{ta ? "இன்னும் கடை இல்லை" : "No store yet"}</h3>
          <p className="muted">{ta ? "முதலில் Stores பக்கத்தில் ஒரு கடை உருவாக்குங்கள் — பிறகு அதன் dashboard இங்கே தோன்றும்." : "Create a store on the Stores page first — its dashboard will appear here."}</p>
          <Link className="btn primary" href="/app/stores">{ta ? "Stores பக்கத்திற்குச் செல்" : "Go to Stores"}</Link>
        </div>
      )}

      {stores.length > 0 && (
        <>
          <div className="grid">
            <div className="card holo"><div className="kpi">{stores.length}</div><p className="muted">{ta ? "என் கடைகள்" : "My stores"}</p></div>
            <div className="card holo"><div className="kpi">{products.length}</div><p className="muted">{ta ? "பொருட்கள்" : "Products"}</p></div>
            <div className="card holo"><div className="kpi">{orders.length}</div><p className="muted">{ta ? "வந்த order-கள்" : "Orders received"}</p></div>
            {Object.entries(salesByCurrency).map(([cur, minor]) => (
              <div key={cur} className="card holo">
                <div className="kpi">{money(minor, cur)}</div>
                <p className="muted">{ta ? "பதிவான விற்பனை (ரத்தானவை தவிர)" : "Sales recorded (excl. cancelled)"}</p>
              </div>
            ))}
          </div>
          <p className="small muted">{ta
            ? "விற்பனை மொத்தம் = இந்த அமைப்பில் பதிவான order-களிலிருந்து, நிலை வாரியாகக் கணக்கிடப்பட்டது."
            : "Sales totals are computed from orders recorded in this system, grouped by status:"}</p>
          <div className="row small">
            {totals.map((t) => (
              <span key={`${t.currency}-${t.status}`} className="badge">{t.status.replace(/_/g, " ")}: {t.n} · {money(Number(t.total_minor), t.currency)}</span>
            ))}
            {totals.length === 0 && <span className="muted">{ta ? "இன்னும் order இல்லை." : "No orders yet."}</span>}
          </div>

          {lowStock.length > 0 && (
            <>
              <h2>⚠️ {ta ? "குறைந்த இருப்பு (≤ 3)" : "Low stock (≤ 3)"}</h2>
              <div className="row">
                {lowStock.map((p) => (
                  <span key={p.id} className="badge sim">{p.name} — {p.stock} {ta ? "மீதம்" : "left"}</span>
                ))}
              </div>
            </>
          )}

          {stores.map((s) => (
            <div key={s.id} className="card">
              <h3>{s.name}</h3>
              <p className="small muted">{s.category} · {s.city}, {s.country} · {ta ? "Delivery கட்டணம்:" : "Delivery fee:"} {money(s.delivery_fee_minor, s.currency)}{s.cod_enabled ? " · COD ✓" : ""}{s.suspended ? ` · ${ta ? "நிறுத்தப்பட்டது" : "suspended"}` : ""}</p>
              <div className="grid">
                {products.filter((p) => p.store_id === s.id).map((p) => (
                  <ProductCard key={p.id} p={p} ta={ta} onSaved={refresh} />
                ))}
                {products.filter((p) => p.store_id === s.id).length === 0 && (
                  <p className="muted">{ta ? "இந்தக் கடையில் இன்னும் பொருட்கள் இல்லை — Stores பக்கத்தில் சேர்க்கவும்." : "No products in this store yet — add them on the Stores page."}</p>
                )}
              </div>
            </div>
          ))}

          <h2>📦 {ta ? "என் கடைகளுக்கு வந்த order-கள்" : "Orders received"}</h2>
          <p className="muted small">{ta
            ? "வாங்குபவரின் விவரங்கள் இந்த order-இன் கடைக்கு மட்டுமே தெரியும். நிலைப் படிகள் கடையால் புதுப்பிக்கப்படுபவை — GPS அல்ல."
            : "Buyer details are visible only to the store that received the order. Status steps are updated by the store — not GPS tracking."}</p>
          {orders.length === 0 && <p className="muted">{ta ? "இன்னும் order இல்லை." : "No orders yet."}</p>}
          {orders.map((o) => (
            <div key={o.id} className="card">
              <b>{o.store_name}</b> — {money(o.total_minor, o.currency)} · {o.buyer_name} · {o.buyer_phone}
              <p className="small">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p>
              <p className="small muted">{o.buyer_address}</p>
              <Timeline o={o} />
              <div className="row" style={{ marginTop: 8 }}>
                {["confirmed", "packed", "shipped"].map((s) => (
                  <button key={s} className="btn small" onClick={() => orderAct("sellerStatus", o.id, { status: s })}>{s}</button>
                ))}
                {!o.seller_confirmed_payment && <button className="btn small primary" onClick={() => orderAct("sellerConfirmPayment", o.id)}>{ta ? "பணம் வந்தது ✓" : "Payment received ✓"}</button>}
                {o.buyer_marked_paid && !o.seller_confirmed_payment && <span className="badge">{ta ? "வாங்குபவர் பணம் செலுத்தியதாகக் குறித்தார்" : "Buyer marked paid"}</span>}
                <button className="btn small danger" onClick={() => orderAct("sellerStatus", o.id, { status: "cancelled" })}>{ta ? "ரத்து" : "Cancel"}</button>
              </div>
            </div>
          ))}
        </>
      )}

      <h2>✉️ {ta ? "வாங்குபவர்களின் செய்திகள்" : "Buyer messages"}</h2>
      {!enqReady ? (
        <p className="muted">{ta
          ? "கடைச் செய்திகள் அமைக்கப்படுகிறது — விரைவில் இங்கே தோன்றும்."
          : "Store messages are being set up — they will appear here soon."}</p>
      ) : (
        <>
          <p className="muted small">{ta
            ? "இவை பதிவு செய்யப்பட்ட செய்திகள் — நேரடி chat அல்ல. கடை உரிமையாளர் தன் dashboard-இல் படிப்பார்."
            : "These are recorded messages — not live chat. The store owner reads them in this dashboard."}</p>
          {enqIn.length === 0 && <p className="muted">{ta ? "இன்னும் செய்தி இல்லை." : "No messages yet."}</p>}
          {enqIn.map((e) => (
            <div key={e.id} className="card">
              <b>{e.store_name}</b> — {e.buyer_name} <span className="small muted">· {fmtDate(e.created_at)}</span>
              <p style={{ margin: "6px 0" }}>{e.message}</p>
            </div>
          ))}
          {enqOut.length > 0 && (
            <>
              <h3>{ta ? "நான் கடைகளுக்கு அனுப்பியவை" : "Messages I sent to stores"}</h3>
              {enqOut.map((e) => (
                <div key={e.id} className="card">
                  <b>{e.store_name}</b> <span className="small muted">· {fmtDate(e.created_at)}</span>
                  <p style={{ margin: "6px 0" }}>{e.message}</p>
                </div>
              ))}
            </>
          )}
        </>
      )}

      <h2>🛵 {ta ? "என் Delivery வேலை" : "My delivery work"}</h2>
      {partner ? (
        <>
          <div className="grid">
            <div className="card holo"><div className="kpi">{deliveryStats.completed}</div><p className="muted">{ta ? "முடித்த delivery-கள்" : "Deliveries completed"}</p></div>
            <div className="card holo"><div className="kpi">{money(deliveryStats.feesEarnedMinor)}</div><p className="muted">{ta ? "ஈட்டிய கட்டணங்கள் (முடித்தவை)" : "Fees earned (completed)"}</p></div>
          </div>
          {deliveries.length === 0 && <p className="muted">{ta ? "இன்னும் delivery எடுக்கவில்லை — Delivery பக்கத்தில் கிடைப்பவற்றை எடுக்கவும்." : "No deliveries claimed yet — claim available ones on the Delivery page."}</p>}
          {deliveries.map((o) => (
            <div key={o.id} className="card">
              <b>{o.store_name}</b> — {o.status.replace(/_/g, " ")} · {ta ? "கட்டணம்" : "Fee"}: {money(o.delivery_fee_minor, o.currency)}
              <p className="small">{o.buyer_name} · {o.buyer_phone}<br />{o.buyer_address}</p>
              <div className="row">
                {o.status !== "delivered" && ["picked_up", "out_for_delivery", "delivered"].filter((s) => s !== o.status).map((s) => (
                  <button key={s} className="btn small" onClick={() => deliveryAct(o.id, s)}>{s.replace(/_/g, " ")}</button>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="card">
          <p className="muted">{ta
            ? "நீங்கள் இன்னும் Delivery கூட்டாளராகப் பதிவு செய்யவில்லை. பதிவு செய்தால் உங்கள் delivery-களும் ஈட்டிய கட்டணங்களும் இங்கேயும் தோன்றும்."
            : "You are not registered as a Delivery Partner yet. Once you register, your deliveries and fees earned will appear here too."}</p>
          <Link className="btn" href="/app/delivery">{ta ? "Delivery பக்கத்தில் பதிவு செய்" : "Register on the Delivery page"}</Link>
        </div>
      )}
    </AppShell>
  );
}
