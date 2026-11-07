"use client";
import React, { useEffect, useRef, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { ErrBox } from "@/components/ui";
import { api } from "@/lib/client";

interface Media { id: number; kind: string; name: string; blob_url: string; size_bytes: number }

const ACCEPT: Record<string, string> = {
  image: "image/*,.jpg,.jpeg,.png,.webp,.gif",
  logo: "image/*,.jpg,.jpeg,.png,.webp",
  audio: "audio/*,.mp3,.m4a,.wav,.ogg",
  video: "video/*,.mp4,.webm,.mov",
};
const EXT_KIND: Record<string, string> = {
  mp4: "video", webm: "video", mov: "video", m4v: "video",
  mp3: "audio", m4a: "audio", wav: "audio", ogg: "audio",
  jpg: "image", jpeg: "image", png: "image", webp: "image", gif: "image",
};
const KIND_TA: Record<string, string> = { image: "படம்", logo: "logo", audio: "ஒலி", video: "வீடியோ" };

/** Detect the real kind from the file itself — MIME type first, extension fallback. */
function detectKind(file: File): string | null {
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (t.startsWith("image/")) return "image";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_KIND[ext] ?? null;
}

/** Never surface raw codes/JSON to the user — map anything technical to a plain sentence. */
function friendly(raw: string, ta: boolean): string {
  if (/SETUP_PENDING|SERVER_ERROR|MEDIA_SETUP_PENDING|UNAUTHORIZED|OWNER_ONLY|HTTP \d|^\{|SyntaxError/i.test(raw)) {
    return ta
      ? "ஏதோ தடை ஏற்பட்டது — சிறிது நேரம் கழித்து மீண்டும் முயற்சியுங்கள்."
      : "Something interrupted that — please wait a moment and try again.";
  }
  return raw;
}

export default function MediaPage() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [items, setItems] = useState<Media[]>([]);
  const [blobReady, setBlobReady] = useState(false);
  const [kind, setKind] = useState("image");
  const [rights, setRights] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [notice, setNotice] = useState("");
  const [phase, setPhase] = useState<"" | "reading" | "uploading">("");
  const [justUploaded, setJustUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const d = await api("/api/media").catch(() => ({ media: [], blobReady: false }));
    setItems((d.media as unknown as Media[]) ?? []);
    setBlobReady(Boolean(d.blobReady));
  }
  useEffect(() => { refresh(); }, []);

  function onFileChosen() {
    setErr(""); setNotice("");
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const detected = detectKind(file);
    if (!detected) {
      setErr(ta
        ? "இந்தக் கோப்பு வகை பயன்படாது. படம் (JPG/PNG/WebP), ஒலி (MP3/M4A/WAV) அல்லது வீடியோ (MP4/WebM) கோப்பைத் தேர்ந்தெடுங்கள்."
        : "This file type is not supported. Please choose an image (JPG/PNG/WebP), audio (MP3/M4A/WAV) or video (MP4/WebM) file.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    // The file itself decides: a "logo" pick only stands for real images;
    // any other mismatch switches the type automatically, with a plain note.
    if (kind === "logo") {
      if (detected !== "image") {
        setKind(detected);
        setNotice(ta
          ? `இது ${KIND_TA[detected]} கோப்பு என்று கண்டறிந்து, வகையை ${KIND_TA[detected]} என மாற்றிவிட்டோம் (logo படங்களுக்கு மட்டும்).`
          : `We detected a ${detected} file and switched the type to ${detected} for you (logo is for images only).`);
      }
    } else if (detected !== kind) {
      setKind(detected);
      setNotice(ta
        ? `இது ${KIND_TA[detected]} கோப்பு என்று கண்டறிந்து, வகையைத் தானாக மாற்றிவிட்டோம்.`
        : `We detected a ${detected} file and switched the type for you automatically.`);
    }
  }

  function resetUpload() {
    setPhase("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setErr(ta ? "முதலில் ஒரு கோப்பைத் தேர்ந்தெடுங்கள்." : "Choose a file first."); return; }
    if (!rights) { setErr(ta ? "உரிமை உறுதிப்படுத்தல் தேவை." : "The rights confirmation is required."); return; }
    const detected = detectKind(file);
    if (!detected) {
      setErr(ta ? "இந்தக் கோப்பு வகை பயன்படாது." : "This file type is not supported.");
      resetUpload();
      return;
    }
    const sendKind = kind === "logo" && detected === "image" ? "logo" : detected;
    setErr(""); setMsg(""); setJustUploaded(false);
    setPhase("reading");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("read"));
        r.readAsDataURL(file);
      });
      const dataBase64 = dataUrl.split(",")[1] ?? "";
      setPhase("uploading");
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: sendKind,
          name: file.name,
          rightsConfirmed: true,
          dataBase64,
          contentType: file.type || "",
        }),
      });
      const d = (await res.json().catch(() => ({}))) as { error?: string; kindCorrected?: boolean; kind?: string };
      if (!res.ok) throw new Error(d.error ?? "Upload failed");
      if (d.kindCorrected && d.kind) {
        setNotice(ta
          ? `கோப்பின் உண்மையான வகை ${KIND_TA[d.kind] ?? d.kind} என்பதால் அப்படியே சேமித்தோம்.`
          : `The file's real type is ${d.kind}, so we saved it as that.`);
      }
      setMsg(ta ? "பதிவேற்றப்பட்டது!" : "Uploaded!");
      setJustUploaded(true);
      resetUpload();
      refresh();
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
      resetUpload(); // full reset — the user can retry immediately
    }
  }
  async function remove(id: number) {
    await api(`/api/media?id=${id}`, { method: "DELETE" }).catch(() => {});
    refresh();
  }
  function useInStudio(m: Media, videoAd: boolean) {
    if (videoAd) {
      sessionStorage.setItem("viralai_template", "clean-starter:video-style:9:16:dark");
    }
    sessionStorage.setItem("viralai_media", String(m.id));
    window.location.href = "/app/studio";
  }

  const busy = phase !== "";
  return (
    <AppShell>
      <h1>🗂️ {ta ? "என் ஊடகம்" : "My Media"}</h1>
      <p className="muted">{ta ? "உங்கள் சொந்தப் படங்கள், logo, ஒலி மற்றும் வீடியோ — தனிப்பட்டவை, உங்கள் கணக்கில் மட்டும். வரம்புகள்: படம்/logo 5 MB · ஒலி 10 MB · வீடியோ 25 MB." : "Your own images, logo, audio and video — private to your account. Limits: image/logo 5 MB · audio 10 MB · video 25 MB."}</p>
      {!blobReady && <p className="errbox">{ta ? "ஊடக சேமிப்பு இன்னும் அமைக்கப்படவில்லை (Blob) — உரிமையாளர் Vercel-இல் இணைப்பார்." : "Media storage is not set up yet (Blob) — the owner will connect it in Vercel."}</p>}
      <ErrBox msg={err} />
      {msg && <p className="okbox">{msg}</p>}
      {notice && <p className="okbox">ℹ️ {notice}</p>}
      {justUploaded && (
        <p className="okbox">{ta
          ? "அடுத்த படி: கீழே உள்ள கோப்பில் “Studio-வில் பயன்படுத்து” என்பதைத் தட்டுங்கள் → உங்கள் வார்த்தைகளைச் சேருங்கள் → சேமியுங்கள் → Export & Share."
          : "Next step: on your file below, tap “Use in Studio” → add your words → Save → Export & Share."}</p>
      )}
      <div className="card">
        <div className="row">
          <select style={{ width: "auto" }} value={kind} onChange={(e) => setKind(e.target.value)} disabled={busy}>
            <option value="image">{ta ? "படம்" : "Image"}</option>
            <option value="logo">Logo</option>
            <option value="audio">{ta ? "ஒலி" : "Audio"}</option>
            <option value="video">{ta ? "வீடியோ" : "Video"}</option>
          </select>
          <input type="file" ref={fileRef} accept={ACCEPT[kind]} onChange={onFileChosen} style={{ width: "auto" }} disabled={busy} />
        </div>
        <p className="small muted">{ta
          ? "கோப்பைத் தேர்ந்தெடுத்தால் அதன் உண்மையான வகையை நாங்களே கண்டுபிடித்து அமைப்போம் — வகையை நீங்கள் சரியாகத் தேர்ந்தெடுக்க வேண்டியதில்லை."
          : "When you pick a file we detect its real type and set it for you — you don't have to pick the right type yourself."}</p>
        <label className="small"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} style={{ width: "auto" }} disabled={busy} /> {ta ? "இந்த ஊடகத்தைப் பயன்படுத்த எனக்கு உரிமை உள்ளது என்பதை உறுதிப்படுத்துகிறேன்." : "I confirm I have the rights to use this media."}</label>
        <p><button className="btn primary" onClick={upload} disabled={busy}>
          {phase === "reading" ? (ta ? "கோப்பைப் படிக்கிறது…" : "Reading file…")
            : phase === "uploading" ? (ta ? "பதிவேற்றுகிறது…" : "Uploading…")
            : ta ? "பதிவேற்று" : "Upload"}
        </button></p>
        <p className="small muted">{ta ? "முழு வீடியோ timeline திருத்தம் பின்னர் வரும் படி (REGISTERED)." : "Full video-timeline editing is a later step (REGISTERED)."}</p>
      </div>
      <div className="grid">
        {items.map((m) => (
          <div key={m.id} className="card holo">
            {m.kind === "image" || m.kind === "logo" ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.blob_url} alt="" style={{ width: "100%", borderRadius: 10 }} />
              : m.kind === "video" ? <video src={m.blob_url} controls playsInline preload="metadata" style={{ width: "100%" }} />
              : <audio src={m.blob_url} controls style={{ width: "100%" }} />}
            <p className="small">{m.name} · {(m.size_bytes / 1024 / 1024).toFixed(2)} MB</p>
            <div className="row">
              <button className="btn small primary" onClick={() => useInStudio(m, false)}>{ta ? "Studio-வில் பயன்படுத்து" : "Use in Studio"}</button>
              {m.kind === "video" && <button className="btn small" onClick={() => useInStudio(m, true)}>{ta ? "Video விளம்பரம் செய்" : "Make a video ad"}</button>}
              <button className="btn small danger" onClick={() => remove(m.id)}>{ta ? "நீக்கு" : "Delete"}</button>
            </div>
            {(m.kind === "image" || m.kind === "video") && (
              <p className="small muted">{ta
                ? "அடுத்து: Studio-வில் வைக்கவும் → வார்த்தைகள் → சேமி → Export & Share."
                : "Next: place it in the Studio → add words → Save → Export & Share."}</p>
            )}
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="muted">{ta ? "இன்னும் ஊடகம் இல்லை." : "No media yet."}</p>}
    </AppShell>
  );
}
