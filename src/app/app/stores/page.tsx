"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, useLang, useMe } from "@/components/Shell";
import { Field, ErrBox } from "@/components/ui";
import { api, money, clientKey } from "@/lib/client";

interface Store { id: number; user_id: number; name: string; category: string; country: string; city: string; about_en: string; payment_link: string; cod_enabled: boolean; delivery_fee_minor: number; currency: string }
interface Product { id: number; store_id: number; name: string; price_minor: number; currency: string; description_en: string; stock: number; in_stock: boolean; photo_url: string | null }

export default function Stores() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const { me } = useMe();
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mine, setMine] = useState(false);
  const [cart, setCart] = useState<Record<number, { storeId: number; qty: number }>>({});
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "", category: "", paymentLink: "", cod: true, fee: "" });
  const [prodForm, setProdForm] = useState({ storeId: "", name: "", price: "", desc: "", stock: "10" });
  const [checkout, setCheckout] = useState({ name: "", phone: "", address: "", payMethod: "cod", delivery: true });
  const [contact, setContact] = useState<Record<number, string>>({});
  const [contactSent, setContactSent] = useState<Record<number, boolean>>({});
  const [myKey] = useState(clientKey());

  async function refresh() {
    const d = await api(`/api/stores${mine ? "?mine=1" : ""}`).catch(() => ({ stores: [], products: [] }));
    setStores((d.stores as Store[]) ?? []);
    setProducts((d.products as Product[]) ?? []);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [mine]);

  const cartItems = Object.entries(cart).filter(([, v]) => v.qty > 0);
  const cartStoreId = cartItems.length ? cartItems[0][1].storeId : null;
  const cartTotal = cartItems.reduce((sum, [pid, v]) => {
    const p = products.find((x) => x.id === Number(pid));
    return sum + (p ? p.price_minor * v.qty : 0);
  }, 0);
  const cartStore = stores.find((s) => s.id === cartStoreId);

  async function createStore() {
    setErr("");
    try {
      await api("/api/stores", { method: "POST", body: JSON.stringify({ action: "createStore", name: form.name, category: form.category, paymentLink: form.paymentLink, codEnabled: form.cod, deliveryFeeMajor: Number(form.fee) || 0 }) });
      setMsg(ta ? "கடை உருவாக்கப்பட்டது!" : "Store created!");
      setForm({ name: "", category: "", paymentLink: "", cod: true, fee: "" });
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  async function addProduct() {
    setErr("");
    try {
      await api("/api/stores", { method: "POST", body: JSON.stringify({ action: "addProduct", storeId: Number(prodForm.storeId), name: prodForm.name, priceMajor: Number(prodForm.price) || 0, descriptionEn: prodForm.desc, stock: Number(prodForm.stock) || 0 }) });
      setProdForm({ ...prodForm, name: "", price: "", desc: "" });
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  async function contactStore(storeId: number) {
    setErr("");
    try {
      await api("/api/stores", { method: "POST", body: JSON.stringify({ action: "contactStore", storeId, message: contact[storeId] ?? "" }) });
      setContactSent({ ...contactSent, [storeId]: true });
      setContact({ ...contact, [storeId]: "" });
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  async function placeOrder() {
    if (!cartStoreId) return;
    setErr("");
    try {
      const res = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          action: "place", storeId: cartStoreId, clientKey: myKey,
          items: cartItems.map(([pid, v]) => ({ productId: Number(pid), qty: v.qty })),
          buyerName: checkout.name, buyerPhone: checkout.phone, buyerAddress: checkout.address,
          payMethod: checkout.payMethod, delivery: checkout.delivery,
        }),
      });
      setMsg(res.duplicate ? (ta ? "இந்த order ஏற்கனவே பதிவாகிவிட்டது (நகல் தடுப்பு)." : "This order was already recorded (duplicate guard).") : (ta ? "Order பதிவானது! கடை உறுதிப்படுத்தும்." : "Order placed! The store will confirm."));
      setCart({});
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }

  return (
    <AppShell>
      <h1>🏪 {ta ? "கடைகள் & Marketplace" : "Stores & Marketplace"}</h1>
      <p className="muted">{ta ? "பணம் வாங்குபவரிடமிருந்து கடைக்கு நேரடியாகச் செல்கிறது (கடையின் இணைப்பு/QR அல்லது COD) — தளம் order பணத்தை ஒருபோதும் வைத்திருக்காது." : "Money goes directly from buyer to store (the store's link/QR or COD) — the platform never holds order money."}</p>
      <div className="section-banner">🛍️ <b>{ta ? "Marketplace" : "Marketplace"}</b> <span className="small muted">{ta ? "ஒவ்வொரு பொருள் அட்டையிலும் படம் கடையின் சொந்தப் படமா அல்லது உள்ளமை வரைபடமா என்ற குறிப்பு இருக்கும் — பொய் படங்கள் இல்லை." : "Every product card is chipped — the shop's own uploaded photo, or a built-in illustration. No fake imagery."}</span></div>
      <div className="row">
        <button className={`btn small ${!mine ? "primary" : ""}`} onClick={() => setMine(false)}>{ta ? "எல்லா கடைகளும்" : "All stores"}</button>
        <button className={`btn small ${mine ? "primary" : ""}`} onClick={() => setMine(true)}>{ta ? "என் கடைகள்" : "My stores"}</button>
        <Link className="btn small" href="/app/store-dashboard">🏪 {ta ? "என் கடை Dashboard" : "My Store Dashboard"}</Link>
      </div>
      <ErrBox msg={err} />
      {msg && <p className="okbox">{msg}</p>}

      {stores.map((s) => (
        <div key={s.id} className="card holo">
          <h3>{s.name}</h3>
          <p className="small muted">{s.category} · {s.city}, {s.country} · {ta ? "Delivery கட்டணம்:" : "Delivery fee:"} {money(s.delivery_fee_minor, s.currency)}{s.cod_enabled ? " · COD ✓" : ""}</p>
          {s.about_en && <p>{s.about_en}</p>}
          {me && s.user_id !== me.id && (
            <div style={{ margin: "10px 0" }}>
              <Field label={ta ? "கடைக்குச் செய்தி அனுப்பு" : "Message this store"}>
                <textarea value={contact[s.id] ?? ""} onChange={(e) => setContact({ ...contact, [s.id]: e.target.value })} rows={2} placeholder={ta ? "உங்கள் கேள்வியை எழுதுங்கள்…" : "Write your question…"} />
              </Field>
              <button className="btn small" onClick={() => contactStore(s.id)}>{ta ? "✉️ கடையைத் தொடர்பு கொள்" : "✉️ Contact store"}</button>
              {contactSent[s.id] && <span className="small" style={{ marginLeft: 8 }}>✓ {ta ? "அனுப்பப்பட்டது" : "Sent"}</span>}
              <p className="small muted">{ta
                ? "இது பதிவு செய்யப்படும் செய்தி — கடை உரிமையாளர் தன் Dashboard-இல் படிப்பார். நேரடி chat அல்ல."
                : "This is a recorded message — the store owner reads it in their dashboard. Not live chat."}</p>
            </div>
          )}
          <div className="grid">
            {products.filter((p) => p.store_id === s.id).map((p) => (
              <div key={p.id} className="card holo" style={{ margin: 0 }}>
                {p.photo_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.photo_url} alt="" style={{ width: "100%", borderRadius: 10 }} /> : <div style={{ fontSize: 34 }}>🛍️</div>}
                <p style={{ margin: "6px 0" }}>{p.photo_url
                  ? <span className="chip own">{ta ? "கடையின் சொந்தப் படம் · Shop's own photo" : "Shop's own photo"}</span>
                  : <span className="chip builtin">{ta ? "உள்ளமை வரைபடம் · Built-in illustration" : "Built-in illustration"}</span>}</p>
                <b>{p.name}</b>
                <p className="small">{money(p.price_minor, p.currency)} · {p.in_stock && p.stock > 0 ? (ta ? "இருப்பு உள்ளது" : "In stock") : (ta ? "இருப்பு இல்லை" : "Out of stock")}</p>
                {p.description_en && <p className="small muted">{p.description_en}</p>}
                <div className="row">
                  <button className="btn small" onClick={() => setCart({ ...cart, [p.id]: { storeId: s.id, qty: Math.max(0, (cart[p.id]?.qty ?? 0) - 1) } })}>−</button>
                  <span>{cart[p.id]?.qty ?? 0}</span>
                  <button className="btn small" onClick={() => {
                    if (cartStoreId && cartStoreId !== s.id) { setErr(ta ? "ஒரு நேரத்தில் ஒரு கடையிலிருந்து மட்டுமே order செய்ய முடியும்." : "One store per order — finish or clear this cart first."); return; }
                    setCart({ ...cart, [p.id]: { storeId: s.id, qty: (cart[p.id]?.qty ?? 0) + 1 } });
                  }}>+</button>
                  <button className="btn small" onClick={() => { sessionStorage.setItem("viralai_template", "clean-starter:poster:1:1:dark"); window.location.href = "/app/studio"; }}>{ta ? "இதை விளம்பரப்படுத்து" : "Promote this"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {cartStore && cartItems.length > 0 && (
        <div className="card" style={{ borderColor: "var(--gold)" }}>
          <h3>🧾 {ta ? "Checkout" : "Checkout"} — {cartStore.name}</h3>
          <p>{ta ? "மொத்தம்:" : "Total:"} <b>{money(cartTotal + (checkout.delivery ? cartStore.delivery_fee_minor : 0), cartStore.currency)}</b> {ta ? "(delivery உட்பட)" : "(incl. delivery if chosen)"}</p>
          {cartStore.payment_link && checkout.payMethod === "link" && (
            <p className="small">{ta ? "கடையின் பண இணைப்பு:" : "Store payment link:"} <a href={cartStore.payment_link} target="_blank" rel="noreferrer">{cartStore.payment_link}</a></p>
          )}
          <Field label={ta ? "உங்கள் பெயர்" : "Your name"}><input value={checkout.name} onChange={(e) => setCheckout({ ...checkout, name: e.target.value })} /></Field>
          <Field label={ta ? "தொலைபேசி" : "Phone"}><input value={checkout.phone} onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })} /></Field>
          <Field label={ta ? "முகவரி" : "Address"}><textarea value={checkout.address} onChange={(e) => setCheckout({ ...checkout, address: e.target.value })} rows={2} /></Field>
          <div className="row">
            <label><input type="radio" name="pm" checked={checkout.payMethod === "cod"} onChange={() => setCheckout({ ...checkout, payMethod: "cod" })} style={{ width: "auto" }} /> COD</label>
            <label><input type="radio" name="pm" checked={checkout.payMethod === "link"} onChange={() => setCheckout({ ...checkout, payMethod: "link" })} style={{ width: "auto" }} /> {ta ? "கடையின் இணைப்பு/QR" : "Store link/QR"}</label>
            <label><input type="checkbox" checked={checkout.delivery} onChange={(e) => setCheckout({ ...checkout, delivery: e.target.checked })} style={{ width: "auto" }} /> {ta ? "Delivery வேண்டும்" : "Delivery"}</label>
          </div>
          <button className="btn primary" onClick={placeOrder}>{ta ? "Order செய்" : "Place order"}</button>
        </div>
      )}

      <div className="grid">
        <div className="card">
          <h3>{ta ? "புதிய கடை" : "New store"}</h3>
          <Field label={ta ? "கடையின் பெயர்" : "Store name"}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={ta ? "வகை" : "Category"}><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label={ta ? "உங்கள் பண இணைப்பு / UPI முகவரி" : "Your payment link / UPI address"}><input value={form.paymentLink} onChange={(e) => setForm({ ...form, paymentLink: e.target.value })} /></Field>
          <Field label={ta ? "Delivery கட்டணம்" : "Delivery fee"}><input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></Field>
          <label className="small"><input type="checkbox" checked={form.cod} onChange={(e) => setForm({ ...form, cod: e.target.checked })} style={{ width: "auto" }} /> COD {ta ? "ஏற்கிறேன்" : "accepted"}</label>
          <p><button className="btn primary" onClick={createStore}>{ta ? "கடையை உருவாக்கு" : "Create store"}</button></p>
        </div>
        <div className="card">
          <h3>{ta ? "பொருள் சேர்" : "Add product"}</h3>
          <Field label={ta ? "கடை" : "Store"}>
            <select value={prodForm.storeId} onChange={(e) => setProdForm({ ...prodForm, storeId: e.target.value })}>
              <option value="">—</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label={ta ? "பொருளின் பெயர்" : "Product name"}><input value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} /></Field>
          <Field label={ta ? "விலை" : "Price"}><input type="number" value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} /></Field>
          <Field label={ta ? "விளக்கம்" : "Description"}><input value={prodForm.desc} onChange={(e) => setProdForm({ ...prodForm, desc: e.target.value })} /></Field>
          <Field label={ta ? "இருப்பு" : "Stock"}><input type="number" value={prodForm.stock} onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })} /></Field>
          <button className="btn primary" onClick={addProduct}>{ta ? "பொருளைச் சேர்" : "Add product"}</button>
          <p className="small muted">{ta ? "புகைப்படம்: முதலில் My Media-வில் பதிவேற்றி, பிறகு Studio-வில் பயன்படுத்துங்கள்." : "Photos: upload in My Media first, then use them in the Studio."}</p>
        </div>
      </div>
    </AppShell>
  );
}
