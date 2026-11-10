"use client";
import React, { useRef, useState } from "react";
import type { DesignDef } from "@/lib/designs";
import type { Lang } from "@/lib/client";

export function Badge({ kind, lang }: { kind: "sim" | "reg" | "live" | "premium" | "free"; lang: Lang }) {
  const map = {
    sim: { en: "SIMULATED", ta: "போலி · SIMULATED", cls: "badge sim" },
    reg: { en: "REGISTERED", ta: "பதிவு · REGISTERED", cls: "badge reg" },
    live: { en: "LIVE", ta: "நேரடி · LIVE", cls: "badge live" },
    premium: { en: "PREMIUM", ta: "PREMIUM", cls: "badge premium" },
    free: { en: "FREE", ta: "இலவசம்", cls: "badge free" },
  } as const;
  const b = map[kind];
  return <span className={b.cls}>{lang === "ta" ? b.ta : b.en}</span>;
}

/** A placed video playing inside a design scene. Browsers only allow
 *  autoplay when the video starts MUTED, so the preview starts silent —
 *  but the video's OWN sound is one clearly visible tap away: the sound
 *  toggle (≥44px, bilingual) unmutes this element and keeps it playing.
 *  Sound class rule: no placed video may ever be mute-locked. */
function SceneVideo({ src, lang }: { src: string; lang: Lang }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const ta = lang === "ta";
  function toggle() {
    const v = ref.current;
    if (!v) return;
    const next = !soundOn;
    // Drive the muted PROPERTY via the ref — React's muted attribute only
    // sets the initial default, it does not reliably toggle live playback.
    v.muted = !next;
    if (next) v.play().catch(() => {});
    setSoundOn(next);
  }
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={ref} src={src} className="scene-media scene-video" autoPlay muted loop playsInline preload="auto" />
      <button
        type="button"
        className="scene-sound"
        onClick={toggle}
        aria-pressed={soundOn}
        aria-label={soundOn
          ? "Sound on — tap to mute · ஒலி உள்ளது — அணைக்கத் தட்டவும்"
          : "Sound off — tap to hear the video's own sound · ஒலி இல்லை — வீடியோவின் சொந்த ஒலியைக் கேட்கத் தட்டவும்"}
        title={soundOn ? "Sound on · ஒலி உள்ளது" : "Tap for sound · ஒலிக்கத் தட்டவும்"}
      >
        {soundOn ? "🔊" : "🔇"} {ta ? (soundOn ? "ஒலி உள்ளது" : "ஒலி இல்லை") : (soundOn ? "Sound on" : "Sound off")}
      </button>
    </>
  );
}

/** A design preview rendered as a built-in graphic scene (gradient + words).
 *  Imagery is generated scenes/gradients — never a claimed AI photo/video. */
export function DesignScene({
  design,
  headline,
  offer,
  business,
  lang,
  mediaUrl,
  mediaKind,
}: {
  design: DesignDef;
  headline: string;
  offer: string;
  business: string;
  lang: Lang;
  mediaUrl?: string;
  mediaKind?: string;
}) {
  const [a, b, accent] = design.palette;
  const ratio = design.size === "9:16" ? "9/16" : design.size === "16:9" ? "16/9" : design.size === "4:5" ? "4/5" : "1/1";
  const words = headline.split(/\s+/).filter(Boolean);
  return (
    <div
      className={`scene kind-${design.kind} ${design.kind === "animated" || design.kind === "video-style" || design.kind === "cinematic" ? "scene-anim" : ""}`}
      style={{ aspectRatio: ratio, background: `linear-gradient(150deg, ${a}, ${b})`, color: design.theme === "light" ? "#111" : "#fff" }}
    >
      {mediaUrl && mediaKind === "video" ? (
        // A placed video PLAYS inside the design, replacing the built-in
        // scene — with a sound toggle (see SceneVideo): autoplay starts
        // muted by browser rule, the video's own sound is one tap away.
        <SceneVideo src={mediaUrl} lang={lang} />
      ) : mediaUrl && mediaKind !== "audio" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="" className="scene-media" />
      ) : null}
      <div className="scene-inner">
        {business ? <div className="scene-biz">{business}</div> : null}
        {design.kind === "animated" || design.kind === "video-style" || design.kind === "cinematic" ? (
          <div className="scene-head karaoke">
            {words.map((w, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.35}s`, color: i % 3 === 2 ? accent : undefined }}>
                {w}{" "}
              </span>
            ))}
          </div>
        ) : (
          <div className="scene-head">{headline}</div>
        )}
        {offer ? <div className="scene-offer" style={{ background: accent }}>{offer}</div> : null}
        <div className="scene-family">{lang === "ta" ? design.familyTa : design.familyEn} · {design.size}</div>
      </div>
      {(design.kind === "video-style" || design.kind === "cinematic") && (
        <div className="scene-bar"><span /></div>
      )}
    </div>
  );
}

export function Busy({ lang }: { lang: Lang }) {
  return <p className="muted">{lang === "ta" ? "ஏற்றுகிறது…" : "Loading…"}</p>;
}

export function ErrBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="errbox">{msg}</p>;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
