"use client";
import React, { useEffect, useRef, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { ErrBox } from "@/components/ui";
import { api } from "@/lib/client";

interface Media { id: number; kind: string; name: string; blob_url: string; size_bytes: number }

export default function MediaPage() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [items, setItems] = useState<Media[]>([]);
  const [blobReady, setBlobReady] = useState(false);
  const [kind, setKind] = useState("image");
  const [rights, setRights] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const d = await api("/api/media").catch(() => ({ media: [], blobReady: false }));
    setItems((d.media as Media[]) ?? []);
    setBlobReady(Boolean(d.blobReady));
  }
  useEffect(() => { refresh(); }, []);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setErr(ta ? "முதலில் ஒரு கோப்பைத் தேர்ந்தெடுங்கள்." : "Choose a file first."); return; }
    if (!rights) { setErr(ta ? "உரிமை உறுதிப்படுத்தல் தேவை." : "The rights confirmation is required."); return; }
    setErr("");
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    form.append("rightsConfirmed", "true");
    try {
      const res = await fetch("/api/media", { method: "POST", body: form });
      const d = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(d.error ?? "Upload failed");
      setMsg(ta ? "பதிவேற்றப்பட்டது!" : "Uploaded!");
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  }
  async function remove(id: number) {
    await api(`/api/media?id=${id}`, { method: "DELETE" }).catch(() => {});
    refresh();
  }

  return (
    <AppShell>
      <h1>🗂️ {ta ? "என் ஊடகம்" : "My Media"}</h1>
      <p className="muted">{ta ? "உங்கள் சொந்தப் படங்கள், logo, ஒலி மற்றும் வீடியோ — தனிப்பட்டவை, உங்கள் கணக்கில் மட்டும். வரம்புகள்: படம்/logo 5 MB · ஒலி 10 MB · வீடியோ 25 MB." : "Your own images, logo, audio and video — private to your account. Limits: image/logo 5 MB · audio 10 MB · video 25 MB."}</p>
      {!blobReady && <p className="errbox">{ta ? "ஊடக சேமிப்பு இன்னும் அமைக்கப்படவில்லை (Blob) — உரிமையாளர் Vercel-இல் இணைப்பார்." : "Media storage is not set up yet (Blob) — the owner will connect it in Vercel."}</p>}
      <ErrBox msg={err} />
      {msg && <p className="okbox">{msg}</p>}
      <div className="card">
        <div className="row">
          <select style={{ width: "auto" }} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="image">{ta ? "படம்" : "Image"}</option>
            <option value="logo">Logo</option>
            <option value="audio">{ta ? "ஒலி" : "Audio"}</option>
            <option value="video">{ta ? "வீடியோ" : "Video"}</option>
          </select>
          <input type="file" ref={fileRef} style={{ width: "auto" }} />
        </div>
        <label className="small"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} style={{ width: "auto" }} /> {ta ? "இந்த ஊடகத்தைப் பயன்படுத்த எனக்கு உரிமை உள்ளது என்பதை உறுதிப்படுத்துகிறேன்." : "I confirm I have the rights to use this media."}</label>
        <p><button className="btn primary" onClick={upload}>{ta ? "பதிவேற்று" : "Upload"}</button></p>
        <p className="small muted">{ta ? "முழு வீடியோ timeline திருத்தம் பின்னர் வரும் படி (REGISTERED)." : "Full video-timeline editing is a later step (REGISTERED)."}</p>
      </div>
      <div className="grid">
        {items.map((m) => (
          <div key={m.id} className="card">
            {m.kind === "image" || m.kind === "logo" ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.blob_url} alt="" style={{ width: "100%", borderRadius: 10 }} />
              : m.kind === "video" ? <video src={m.blob_url} controls style={{ width: "100%" }} />
              : <audio src={m.blob_url} controls style={{ width: "100%" }} />}
            <p className="small">{m.name} · {(m.size_bytes / 1024 / 1024).toFixed(2)} MB</p>
            <button className="btn small danger" onClick={() => remove(m.id)}>{ta ? "நீக்கு" : "Delete"}</button>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="muted">{ta ? "இன்னும் ஊடகம் இல்லை." : "No media yet."}</p>}
    </AppShell>
  );
}
