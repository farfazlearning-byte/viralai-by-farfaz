"use client";
import React, { useEffect, useMemo, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { DesignScene, Field, ErrBox, Badge } from "@/components/ui";
import { ExportShare } from "@/components/ExportShare";
import { api } from "@/lib/client";
import { allDesigns, designById, type DesignDef } from "@/lib/designs";
import { CATEGORIES, categoryByKey } from "@/lib/categories";

interface Creative {
  id: number; title: string; headline: string; body: string; design_key: string; campaign_id: number | null;
  media_url: string | null; media_kind: string | null; data: { business?: string; offer?: string } | string | null;
}
interface Campaign { id: number; name: string; is_sample: boolean }
interface MediaItem { id: number; kind: string; name: string; blob_url: string }

export default function Studio() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const starter = useMemo(() => allDesigns().find((d) => d.familyKey === "clean-starter" && d.kind === "poster" && d.size === "1:1" && d.theme === "dark")!, []);
  const [design, setDesign] = useState<DesignDef>(starter);
  const [business, setBusiness] = useState("");
  const [headline, setHeadline] = useState(ta ? "இன்றைய சிறப்பு சலுகை" : "Today's special offer");
  const [offer, setOffer] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaId, setMediaId] = useState("");
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [myCats, setMyCats] = useState<string[]>([]);
  const [canRemoveWatermark, setCanRemoveWatermark] = useState(false);
  const [placedNote, setPlacedNote] = useState(false);

  async function refresh() {
    const c = await api("/api/campaigns").catch(() => ({ campaigns: [] }));
    setCampaigns((c.campaigns as Campaign[]) ?? []);
    const cr = await api("/api/creatives").catch(() => ({ creatives: [] }));
    setCreatives((cr.creatives as Creative[]) ?? []);
    const m = await api("/api/media").catch(() => ({ media: [] }));
    setMedia((m.media as MediaItem[]) ?? []);
    const a = await api("/api/account").catch(() => ({}) as Record<string, unknown>);
    const cats = (a.chosenCategories as string[]) ?? [];
    setMyCats(cats);
    const pos = a.position as { tier?: string } | undefined;
    setCanRemoveWatermark(Boolean(pos && pos.tier && pos.tier !== "free"));
    if (cats.length && !business) {
      const cat = categoryByKey(cats[0]);
      if (cat) {
        setHeadline(ta ? cat.headlineTa : cat.headlineEn);
        setOffer(ta ? cat.offerTa : cat.offerEn);
      }
    }
  }
  useEffect(() => {
    refresh();
    const t = sessionStorage.getItem("viralai_template");
    if (t) {
      const d = designById(t);
      if (d) setDesign(d);
      sessionStorage.removeItem("viralai_template");
    }
    const mid = sessionStorage.getItem("viralai_media");
    if (mid) {
      setMediaId(mid);
      setPlacedNote(true);
      sessionStorage.removeItem("viralai_media");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const variants = useMemo(() => {
    const h = headline || (ta ? "உங்கள் தலைப்பு" : "Your headline");
    return [
      h,
      `${h} — ${ta ? "இன்று மட்டும்" : "today only"}`,
      `${ta ? "புதிதாக வந்துள்ளது:" : "Just arrived:"} ${h}`,
    ];
  }, [headline, ta]);

  const chosenMedia = media.find((m) => String(m.id) === mediaId);

  async function save() {
    setErr(""); setMsg("");
    try {
      await api("/api/creatives", {
        method: "POST",
        body: JSON.stringify({
          action: "create", designKey: design.id, title: headline, headline, bodyText,
          business, offer, language: lang, campaignId: campaignId ? Number(campaignId) : null,
          mediaId: mediaId ? Number(mediaId) : null,
        }),
      });
      setMsg(ta ? "சேமிக்கப்பட்டது — உங்கள் creative நூலகத்தில் உள்ளது." : "Saved — it is in your creative library below.");
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <AppShell>
      <h1>🎨 {ta ? "விளம்பர Studio" : "Ad Creative Studio"}</h1>
      <p className="muted">{ta ? "ஒரு design-ஐத் தேர்ந்தெடுத்து, உங்கள் வார்த்தைகளைப் போடுங்கள் — Instagram, WhatsApp, Google மற்றும் Story மாதிரிகளில் உடனே பாருங்கள்." : "Pick a design, add your words — preview instantly as Instagram, WhatsApp, Google and Story mockups."} <a href="/app/library">{ta ? "முழு நூலகம் →" : "Full Library →"}</a></p>
      <div className="row">
        <span className="badge">{ta ? design.familyTa : design.familyEn}</span>
        {design.premium ? <Badge kind="premium" lang={lang} /> : <Badge kind="free" lang={lang} />}
        <span className="badge">{design.size}</span>
        <span className="badge">{ta ? design.kindTa : design.kindEn}</span>
        <button className="btn small" onClick={() => { sessionStorage.removeItem("viralai_template"); setDesign(starter); }}>{ta ? "வார்ப்புருவை நீக்கு" : "Clear template"}</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        <div className="card">
          <Field label={ta ? "தொழிலின் பெயர்" : "Business name"}><input value={business} onChange={(e) => setBusiness(e.target.value)} /></Field>
          <Field label={ta ? "தலைப்பு" : "Headline"}><input value={headline} onChange={(e) => setHeadline(e.target.value)} /></Field>
          <div className="row">{variants.map((v, i) => (
            <button key={i} className="btn small" onClick={() => setHeadline(v)}>A/B {i + 1}</button>
          ))}</div>
          <p className="small muted">{ta ? "A/B மாறுபாடுகள் — தட்டினால் தலைப்பு மாறும்:" : "A/B variants — tap to use:"} {variants.join(" · ")}</p>
          <Field label={ta ? "சலுகை வரி" : "Offer line"}><input value={offer} onChange={(e) => setOffer(e.target.value)} /></Field>
          <Field label={ta ? "விளக்க உரை" : "Body text"}><textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={3} /></Field>
          <Field label={ta ? "என் Media (விருப்பம்)" : "My media (optional)"}>
            <select value={mediaId} onChange={(e) => setMediaId(e.target.value)}>
              <option value="">{ta ? "— இல்லை —" : "— none —"}</option>
              {media.map((m) => <option key={m.id} value={m.id}>{m.kind}: {m.name}</option>)}
            </select>
          </Field>
          <Field label={ta ? "பிரச்சாரத்துடன் இணை (விருப்பம்)" : "Attach to campaign (optional)"}>
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
              <option value="">—</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <ErrBox msg={err} />
          {msg && <p className="okbox">{msg}</p>}
          <button className="btn primary" onClick={save}>{ta ? "Creative-ஐச் சேமி" : "Save creative"}</button>
          {myCats.length > 0 && <p className="small muted">{ta ? "உங்கள் வகைகள்:" : "Your categories:"} {myCats.map((k) => categoryByKey(k)?.icon ?? "").join(" ")}</p>}
        </div>
        <div>
          {placedNote && (
            <p className="okbox">{ta
              ? "உங்கள் ஊடகம் இங்கே வைக்கப்பட்டது ✓ — அடுத்து: உங்கள் வார்த்தைகளைச் சேருங்கள் → சேமியுங்கள் → Export & Share."
              : "Your media is placed here ✓ — Next: add your words → Save → Export & Share."}</p>
          )}
          <DesignScene design={design} headline={headline} offer={offer} business={business} lang={lang} mediaUrl={chosenMedia?.blob_url} mediaKind={chosenMedia?.kind} />
          {chosenMedia?.kind === "audio" && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio src={chosenMedia.blob_url} controls style={{ width: "100%", marginTop: 8 }} />
          )}
          <ExportShare design={design} headline={headline} offer={offer} business={business} lang={lang}
            mediaUrl={chosenMedia?.blob_url} mediaKind={chosenMedia?.kind} canRemoveWatermark={canRemoveWatermark} />
          <div className="card">
            <h3>📱 {ta ? "சேனல் மாதிரிகள்" : "Channel mockups"}</h3>
            <p><b>Instagram:</b> {business || "•••"} — {headline}</p>
            <p><b>WhatsApp:</b> {ta ? "வணக்கம்!" : "Hello!"} {headline} {offer ? `(${offer})` : ""}</p>
            <p><b>Google:</b> <span style={{ color: "#8ab4f8" }}>{headline} | {business || "Your Business"}</span><br /><span className="small muted">{bodyText || (ta ? "உங்கள் விளக்கம் இங்கே வரும்." : "Your description appears here.")}</span></p>
            <p className="small muted">{ta ? "இவை மாதிரிகள் — உண்மையான விளம்பரங்கள் உரிமையாளர் தன் கணக்குகளை இணைக்கும்போது மட்டுமே வெளியாகும்." : "These are mockups — real ads publish only when the owner connects his own accounts."} <Badge kind="reg" lang={lang} /></p>
          </div>
        </div>
      </div>
      <h2>{ta ? "என் creative நூலகம்" : "My creative library"}</h2>
      {creatives.length === 0 ? <p className="muted">{ta ? "இன்னும் இல்லை — முதல் creative-ஐச் சேமியுங்கள்." : "None yet — save your first creative."}</p> : (
        <div className="grid">{creatives.map((cr) => {
          const d = designById(cr.design_key) ?? starter;
          const data = typeof cr.data === "string" ? (() => { try { return JSON.parse(cr.data) as { business?: string; offer?: string }; } catch { return {}; } })() : (cr.data ?? {});
          return (
            <div key={cr.id} className="card holo">
              <DesignScene design={d} headline={cr.headline || cr.title} offer={data.offer ?? ""} business={data.business ?? ""} lang={lang}
                mediaUrl={cr.media_url ?? undefined} mediaKind={cr.media_kind ?? undefined} />
              <p style={{ marginTop: 8 }}><b>{cr.title || cr.headline}</b></p>
              <p className="small muted">{cr.design_key}</p>
              <button className="btn small" onClick={async () => { await api("/api/creatives", { method: "POST", body: JSON.stringify({ action: "delete", id: cr.id }) }); refresh(); }}>{ta ? "நீக்கு" : "Delete"}</button>
            </div>
          );
        })}</div>
      )}
      <p className="small muted">{CATEGORIES.length} {ta ? "வகைகள் பதிவு செய்யப்பட்டுள்ளன — Studio தொடக்க வரிகள் உங்கள் வகைக்கு ஏற்ப வரும்." : "business categories are registered — Studio starter lines follow your category."}</p>
    </AppShell>
  );
}
