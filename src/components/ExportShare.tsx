"use client";
import React, { useRef, useState } from "react";
import type { DesignDef } from "@/lib/designs";
import type { Lang } from "@/lib/client";

// Export & Share — renders the composed design (built-in scene + the member's
// OWN placed media) to a real downloadable file in the browser.
// Watermark rule (shown in the UI, EN+TA): "ViralAI by FARFAZ" is burned into
// every export for Free accounts; Premium members may switch it off per export.
// Video export is offered only when the composition includes the member's own
// video; the produced format is whatever the browser's recorder truly makes
// (MP4 where supported, otherwise WebM) and the file is named honestly.
// Sharing is a handoff: the device share sheet / a downloaded file — the app
// never posts into anyone's social accounts.

export const EXPORT_SIZES = [
  { key: "1:1", w: 1080, h: 1080 },
  { key: "9:16", w: 1080, h: 1920 },
  { key: "16:9", w: 1920, h: 1080 },
  { key: "4:5", w: 1080, h: 1350 },
] as const;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}

export function ExportShare({
  design, headline, offer, business, lang, mediaUrl, mediaKind, canRemoveWatermark,
}: {
  design: DesignDef;
  headline: string;
  offer: string;
  business: string;
  lang: Lang;
  mediaUrl?: string;
  mediaKind?: string;
  canRemoveWatermark: boolean;
}) {
  const ta = lang === "ta";
  const [sizeKey, setSizeKey] = useState<string>(design.size);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [watermark, setWatermark] = useState(true);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const wmOn = canRemoveWatermark ? watermark : true;

  const size = EXPORT_SIZES.find((s) => s.key === sizeKey) ?? EXPORT_SIZES[0];

  function drawScene(ctx: CanvasRenderingContext2D, W: number, H: number, media: CanvasImageSource | null, mediaIsVideo: boolean) {
    const [a, b, accent] = design.palette;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, a); g.addColorStop(1, b);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (media) {
      // cover-fit the placed media
      const mw = (media as HTMLVideoElement).videoWidth || (media as HTMLImageElement).naturalWidth || W;
      const mh = (media as HTMLVideoElement).videoHeight || (media as HTMLImageElement).naturalHeight || H;
      const scale = Math.max(W / mw, H / mh);
      const dw = mw * scale, dh = mh * scale;
      ctx.save();
      ctx.globalAlpha = mediaIsVideo ? 0.95 : 0.55;
      ctx.drawImage(media, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.restore();
      const scrim = ctx.createLinearGradient(0, H * 0.35, 0, H);
      scrim.addColorStop(0, "rgba(0,0,0,0)"); scrim.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = scrim; ctx.fillRect(0, 0, W, H);
    }
    const fg = design.theme === "light" && !media ? "#111" : "#ffffff";
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    const cx = W / 2;
    let y = H * 0.34;
    if (business) {
      ctx.font = `600 ${Math.round(W * 0.026)}px "Segoe UI", system-ui, sans-serif`;
      ctx.globalAlpha = 0.85;
      ctx.fillText(business.toUpperCase(), cx, y);
      ctx.globalAlpha = 1;
      y += H * 0.05;
    }
    ctx.font = `800 ${Math.round(W * 0.055)}px "Segoe UI", system-ui, sans-serif`;
    const lines = wrap(ctx, headline || (ta ? "உங்கள் தலைப்பு" : "Your headline"), W * 0.86);
    for (const ln of lines) { ctx.fillText(ln, cx, y); y += W * 0.068; }
    if (offer) {
      ctx.font = `700 ${Math.round(W * 0.032)}px "Segoe UI", system-ui, sans-serif`;
      const tw = ctx.measureText(offer).width + W * 0.05;
      const th = W * 0.062;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(cx - tw / 2, y - th * 0.72, tw, th, th / 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.fillText(offer, cx, y);
      ctx.fillStyle = fg;
    }
    ctx.font = `500 ${Math.round(W * 0.02)}px "Segoe UI", system-ui, sans-serif`;
    ctx.globalAlpha = 0.75;
    ctx.textAlign = "left";
    ctx.fillText(`${ta ? design.familyTa : design.familyEn} · ${design.size}`, W * 0.03, H - W * 0.03);
    ctx.globalAlpha = 1;
    if (wmOn) {
      ctx.font = `700 ${Math.round(W * 0.024)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = "right";
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "#ffffff";
      ctx.fillText("ViralAI by FARFAZ", W - W * 0.03, H - W * 0.03);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = "left";
  }

  async function loadImage(url: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await img.decode();
    return img;
  }

  async function buildCanvas(): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");
    canvas.width = size.w; canvas.height = size.h;
    const ctx = canvas.getContext("2d")!;
    let media: CanvasImageSource | null = null;
    let isVideo = false;
    if (mediaUrl && mediaKind === "video" && videoRef.current) {
      const v = videoRef.current;
      if (v.readyState >= 2) { media = v; isVideo = true; }
    } else if (mediaUrl && mediaKind !== "audio") {
      try { media = await loadImage(mediaUrl); } catch { media = null; }
    }
    drawScene(ctx, size.w, size.h, media, isVideo);
    return canvas;
  }

  function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function taintedNote() {
    setNote(ta
      ? "இந்த ஊடகத்தின் சேமிப்பு browser-இல் export செய்ய அனுமதிக்கவில்லை — அசல் கோப்பை My Media-விலிருந்து பதிவிறக்கலாம்."
      : "This media's storage did not allow in-browser export — you can download the original file from My Media instead.");
  }

  async function exportImage() {
    setBusy("image"); setNote("");
    try {
      const canvas = await buildCanvas();
      const blob = await new Promise<Blob | null>((resolve) => {
        try { canvas.toBlob((b) => resolve(b), format === "png" ? "image/png" : "image/jpeg", 0.92); }
        catch { resolve(null); }
      });
      if (!blob) { taintedNote(); return; }
      download(blob, `viralai-${size.key}.${format === "png" ? "png" : "jpg"}`);
      setNote(ta ? `படம் தயார்: ${size.w}×${size.h} ${format.toUpperCase()}.` : `Image ready: ${size.w}×${size.h} ${format.toUpperCase()}.`);
    } finally { setBusy(""); }
  }

  async function exportVideo() {
    if (mediaKind !== "video" || !mediaUrl) return;
    setBusy("video"); setNote("");
    // Capture source: an offscreen, UNMUTED clone of the placed video. It
    // feeds BOTH the canvas frames and — through WebAudio — a capture of
    // the video's OWN audio track, so the exported file carries the sound.
    // The audio graph ends at a stream destination ONLY (never at
    // ctx.destination), so no sound comes out of the speakers while
    // exporting; the sound lands in the recording. (The hidden JSX element
    // stays muted: it is only a still-frame source for image exports.)
    const el = document.createElement("video");
    let actx: AudioContext | null = null;
    try {
      // Create/resume the AudioContext FIRST, inside this click's call
      // stack, so the browser's user-activation rules let it run.
      try {
        const AC = window.AudioContext
          ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) { actx = new AC(); await actx.resume().catch(() => {}); }
      } catch { actx = null; }
      el.src = mediaUrl;
      el.crossOrigin = "anonymous";
      el.playsInline = true;
      el.muted = false;
      el.volume = 1;
      el.preload = "auto";
      if (el.readyState < 2) {
        await new Promise<void>((resolve) => { el.addEventListener("loadeddata", () => resolve(), { once: true }); setTimeout(resolve, 5000); });
      }
      const canvas = document.createElement("canvas");
      canvas.width = size.w; canvas.height = size.h;
      const ctx = canvas.getContext("2d")!;
      const canvasStream = canvas.captureStream(30);
      // The placed video's own audio track, tapped via WebAudio (best
      // effort: a video with no audio track, or a browser without
      // WebAudio, exports video-only exactly as before).
      let audioTrack: MediaStreamTrack | null = null;
      if (actx) {
        try {
          const srcNode = actx.createMediaElementSource(el);
          const dest = actx.createMediaStreamDestination();
          srcNode.connect(dest);
          audioTrack = dest.stream.getAudioTracks()[0] ?? null;
        } catch { audioTrack = null; }
      }
      const stream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...(audioTrack ? [audioTrack] : []),
      ]);
      const mimes = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
      const mime = mimes.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) ?? "";
      if (!mime) {
        setNote(ta ? "இந்த browser video export-ஐ ஆதரிக்கவில்லை — பட export பயன்படுத்துங்கள்." : "This browser cannot record video exports — please use the image export.");
        return;
      }
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      const done = new Promise<void>((resolve) => { rec.onstop = () => resolve(); });
      el.currentTime = 0;
      await el.play().catch(() => {});
      rec.start(250);
      const maxMs = Math.min((Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 30) * 1000, 60_000);
      const started = Date.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          if (el.paused && !el.ended) el.play().catch(() => {});
          drawScene(ctx, size.w, size.h, el, true);
          if (el.ended || Date.now() - started > maxMs) { resolve(); return; }
          requestAnimationFrame(tick);
        };
        tick();
      });
      rec.stop();
      await done;
      el.pause();
      const ext = mime.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: mime.split(";")[0] });
      download(blob, `viralai-${size.key}.${ext}`);
      setNote(ta
        ? `Video தயார்: உங்கள் browser உருவாக்கிய ${ext.toUpperCase()} கோப்பு (${size.w}×${size.h}).${audioTrack ? " உங்கள் வீடியோவின் சொந்த ஒலியும் அதில் சேர்க்கப்பட்டுள்ளது." : ""}`
        : `Video ready: a ${ext.toUpperCase()} file produced by your browser (${size.w}×${size.h}).${audioTrack ? " Your video's own sound is included in it." : ""}`);
    } catch {
      taintedNote();
    } finally {
      el.pause();
      if (actx) { try { await actx.close(); } catch { /* already closed */ } }
      setBusy("");
    }
  }

  async function share() {
    setBusy("share"); setNote("");
    try {
      const canvas = await buildCanvas();
      const blob = await new Promise<Blob | null>((resolve) => {
        try { canvas.toBlob((b) => resolve(b), "image/png"); } catch { resolve(null); }
      });
      if (!blob) { taintedNote(); return; }
      const file = new File([blob], `viralai-${size.key}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "ViralAI by FARFAZ", text: headline });
        setNote(ta ? "பகிர்வு திறக்கப்பட்டது." : "Share sheet opened.");
      } else {
        download(blob, file.name);
        setNote(ta
          ? "இங்கே பகிர்வுத் திரை இல்லை — கோப்பு பதிவிறக்கமானது; WhatsApp/Instagram-இல் நீங்களே இணைக்கலாம்."
          : "No share sheet here — the file was downloaded instead; attach it in WhatsApp/Instagram yourself.");
      }
    } catch { /* user cancelled the share sheet */ } finally { setBusy(""); }
  }

  return (
    <div className="card">
      <h3>📤 {ta ? "Export & Share" : "Export & Share"}</h3>
      {mediaKind === "video" && mediaUrl && (
        // Hidden STILL-FRAME source for image exports only — it never plays
        // sound and is never heard. Video export builds its own unmuted
        // capture element so the exported file carries the video's audio.
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video ref={videoRef} src={mediaUrl} muted playsInline preload="auto" crossOrigin="anonymous" style={{ display: "none" }} />
      )}
      <div className="row">
        <label className="small">{ta ? "அளவு" : "Size"}{" "}
          <select value={sizeKey} onChange={(e) => setSizeKey(e.target.value)} style={{ width: "auto" }}>
            {EXPORT_SIZES.map((s) => <option key={s.key} value={s.key}>{s.key} — {s.w}×{s.h}</option>)}
          </select>
        </label>
        <label className="small">{ta ? "பட வடிவம்" : "Image format"}{" "}
          <select value={format} onChange={(e) => setFormat(e.target.value as "png" | "jpeg")} style={{ width: "auto" }}>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
          </select>
        </label>
        <label className="small">
          <input type="checkbox" checked={wmOn} disabled={!canRemoveWatermark} onChange={(e) => setWatermark(e.target.checked)} style={{ width: "auto" }} />{" "}
          {ta ? "Watermark: ViralAI by FARFAZ" : "Watermark: ViralAI by FARFAZ"}
        </label>
      </div>
      <p className="small muted">{ta
        ? "விதி: இலவசக் கணக்குகளில் watermark எப்போதும் இருக்கும்; Premium உறுப்பினர்கள் ஒவ்வொரு export-க்கும் அதை அணைக்கலாம்."
        : "Rule: the watermark is always on for Free accounts; Premium members may switch it off per export."}</p>
      <div className="row">
        <button className="btn primary" onClick={exportImage} disabled={busy !== ""}>{busy === "image" ? "…" : ta ? "படமாக Export" : "Export image"}</button>
        {mediaKind === "video" && mediaUrl && (
          <button className="btn" onClick={exportVideo} disabled={busy !== ""}>{busy === "video" ? "…" : ta ? "Video-வாக Export" : "Export video"}</button>
        )}
        <button className="btn" onClick={share} disabled={busy !== ""}>{busy === "share" ? "…" : ta ? "பகிர்" : "Share"}</button>
      </div>
      {mediaKind === "video" && mediaUrl && (
        <p className="small muted">{ta
          ? "Video export உங்கள் video-வையே பயன்படுத்துகிறது; உங்கள் வீடியோவில் ஒலி இருந்தால், export கோப்பிலும் அந்தச் சொந்த ஒலி சேரும். கோப்பு வடிவம் (MP4 அல்லது WebM) உங்கள் browser உருவாக்குவதைப் பொறுத்தது — கோப்புப் பெயர் அதையே உண்மையாகக் காட்டும்."
          : "Video export uses your own placed video; when your video has sound, the exported file includes that same sound. The file format (MP4 or WebM) is whatever your browser truly produces — the file name says so honestly."}</p>
      )}
      <p className="small muted">{ta
        ? "பகிர்வு என்பது கோப்பை உங்கள் சாதனத்தின் பகிர்வுத் திரை வழியாக அனுப்புவது — இந்த app உங்கள் கணக்குகளில் பதிவிடாது."
        : "Sharing hands the file to your device's share sheet — this app does not post into your accounts."}</p>
      {note && <p className="okbox">{note}</p>}
    </div>
  );
}
