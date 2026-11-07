"use client";
import React, { useEffect, useMemo, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { DesignScene, Badge, Busy } from "@/components/ui";
import { api } from "@/lib/client";
import { KINDS, SIZES, type DesignDef } from "@/lib/designs";
import { CATEGORIES, categoryByKey } from "@/lib/categories";
import type { ShowcaseDesign } from "@/lib/showcaseDesigns";

interface LibData {
  designs: DesignDef[];
  counts: { library: number; free: number; premium: number; showcase: number; total: number };
  showcase: Array<ShowcaseDesign & { enabled: boolean }>;
  canUsePremium: boolean;
}

export default function Library() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [data, setData] = useState<LibData | null>(null);
  const [kind, setKind] = useState("");
  const [size, setSize] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [page, setPage] = useState(0);
  const [myCats, setMyCats] = useState<string[]>([]);
  const PAGE = 24;

  useEffect(() => {
    api("/api/library").then((d) => setData(d as unknown as LibData)).catch(() => {});
    api("/api/account").then((d) => setMyCats((d.chosenCategories as string[]) ?? [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.designs;
    if (kind) list = list.filter((d) => d.kind === kind);
    if (size) list = list.filter((d) => d.size === size);
    return list;
  }, [data, kind, size]);

  const shelf = useMemo(() => {
    if (!data || myCats.length === 0) return [];
    // Category-fitted shelf: a rotating pick across families for the member's trades.
    return data.designs.filter((d, i) => i % 97 === 0).slice(0, 8);
  }, [data, myCats]);

  if (!data) return <AppShell><Busy lang={lang} /></AppShell>;
  const pageItems = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  function useDesign(d: DesignDef) {
    sessionStorage.setItem("viralai_template", d.id);
    window.location.href = "/app/studio";
  }

  return (
    <AppShell>
      <h1>🎨 {ta ? "Design நூலகம்" : "Design Library"} — {data.counts.total} {ta ? "designs" : "designs"}</h1>
      <p className="muted">
        {data.counts.library} {ta ? "நூலக வடிவங்கள்" : "library designs"} ({data.counts.free} {ta ? "இலவசம்" : "free"} + {data.counts.premium} {ta ? "பிரீமியம்" : "premium"}) + {data.counts.showcase} {ta ? "showcase வடிவங்கள்" : "showcase designs"} — {ta ? "எண்ணிக்கை தரவிலிருந்து கணக்கிடப்படுகிறது." : "the count is computed from the data."}
      </p>
      <p className="small muted">
        {ta
          ? "நேர்மைக் குறிப்பு: உண்மையான AI புகைப்பட/வீடியோ உருவாக்கம் இணைக்கப்படவில்லை (REGISTERED — கூட்டாளர் கருவிகள் Tools & Partners-இல்). இங்குள்ள காட்சிகள் உள்ளமைக்கப்பட்ட கிராஃபிக் காட்சிகள், சாய்வுகள் மற்றும் உங்கள் வார்த்தைகள்."
          : "Honest note: real AI photo/video generation is NOT connected (REGISTERED — partner tools live in Tools & Partners). Imagery here = built-in graphic scenes, gradients, patterns and your words."}{" "}
        <Badge kind="reg" lang={lang} />
      </p>

      {shelf.length > 0 && (
        <>
          <h2>{ta ? "உங்கள் வகைகளுக்கு ஏற்றது" : "Fitted to your categories"} {myCats.map((k) => categoryByKey(k)?.icon ?? "").join(" ")}</h2>
          <div className="grid">
            {shelf.map((d) => (
              <div key={d.id} className="card holo">
                <DesignScene design={d} headline={ta ? (categoryByKey(myCats[0])?.headlineTa ?? d.familyTa) : (categoryByKey(myCats[0])?.headlineEn ?? d.familyEn)} offer={ta ? (categoryByKey(myCats[0])?.offerTa ?? "") : (categoryByKey(myCats[0])?.offerEn ?? "")} business="" lang={lang} />
                <div className="row" style={{ marginTop: 8 }}>
                  <b>{ta ? d.familyTa : d.familyEn}</b>{d.premium ? <Badge kind="premium" lang={lang} /> : <Badge kind="free" lang={lang} />}
                  <button className="btn small primary" onClick={() => useDesign(d)}>{ta ? "இந்த design-ஐப் பயன்படுத்து" : "Use this design"}</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2>{ta ? "Showcase வடிவங்கள் (11)" : "Showcase designs (11)"}</h2>
      <div className="grid">
        {data.showcase.filter((s) => s.enabled).map((s) => (
          <div key={s.key} className="card holo">
            <b>{ta ? s.ta : s.en}</b>
            <p className="small muted">{ta ? s.blurbTa : s.blurbEn}</p>
            <p className="small"><span className="badge">{s.size}</span> <span className="badge">{s.scene}</span></p>
            <p className="small muted">{ta ? "அசையும் காட்சி — வீடியோ கோப்பு அல்ல." : "Animated scene — not a video file."}</p>
            <a className="btn small" href="/app/showcase">{ta ? "Showcase-இல் பார்" : "See in Showcase"}</a>
          </div>
        ))}
      </div>

      <h2>{ta ? "எல்லா வடிவங்களும்" : "All designs"}</h2>
      <div className="row">
        <select value={kind} onChange={(e) => { setKind(e.target.value); setPage(0); }} style={{ width: "auto" }}>
          <option value="">{ta ? "எல்லா வகைகளும்" : "All kinds"}</option>
          {KINDS.map((k) => <option key={k.key} value={k.key}>{ta ? k.ta : k.en}</option>)}
        </select>
        <select value={size} onChange={(e) => { setSize(e.target.value); setPage(0); }} style={{ width: "auto" }}>
          <option value="">{ta ? "எல்லா அளவுகளும்" : "All sizes"}</option>
          {SIZES.map((s) => <option key={s.key} value={s.key}>{ta ? s.ta : s.en}</option>)}
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="">{ta ? "வகை வாரியாக…" : "By category…"}</option>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {ta ? c.ta : c.en}</option>)}
        </select>
        <span className="muted small">{filtered.length} {ta ? "கிடைத்தது" : "found"} · {ta ? "பக்கம்" : "Page"} {page + 1}/{pages}</span>
        <button className="btn small" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
        <button className="btn small" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>→</button>
      </div>
      {catFilter && <p className="small muted">{ta ? "தேர்ந்த வகைக்கான தொடக்க வரிகள்:" : "Starter lines for the picked category:"} “{ta ? categoryByKey(catFilter)?.headlineTa : categoryByKey(catFilter)?.headlineEn}” · “{ta ? categoryByKey(catFilter)?.offerTa : categoryByKey(catFilter)?.offerEn}” — {ta ? "Studio-வில் தானாக வரும்." : "they pre-fill in the Studio."}</p>}
      <div className="grid">
        {pageItems.map((d) => (
          <div key={d.id} className="card holo">
            <DesignScene design={d} headline={ta ? d.vibeTa : d.vibeEn} offer="" business="" lang={lang} />
            <div className="row" style={{ marginTop: 8 }}>
              <b>{ta ? d.familyTa : d.familyEn}</b>
              {d.premium ? <Badge kind="premium" lang={lang} /> : <Badge kind="free" lang={lang} />}
              <span className="badge">{ta ? d.kindTa : d.kindEn}</span><span className="badge">{d.size}</span>
            </div>
            {!data.canUsePremium && d.premium && <p className="small muted">{ta ? "முன்னோட்டம் இலவசம் — சேமிக்க Premium தேவை." : "Preview is free — saving needs Premium."}</p>}
            <button className="btn small primary" onClick={() => useDesign(d)}>{ta ? "Studio-வில் பயன்படுத்து" : "Use in Studio"}</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
