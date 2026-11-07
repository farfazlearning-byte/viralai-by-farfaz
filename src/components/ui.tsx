"use client";
import React from "react";
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

/** A design preview rendered as a built-in graphic scene (gradient + words).
 *  Imagery is generated scenes/gradients — never a claimed AI photo/video. */
export function DesignScene({
  design,
  headline,
  offer,
  business,
  lang,
  mediaUrl,
}: {
  design: DesignDef;
  headline: string;
  offer: string;
  business: string;
  lang: Lang;
  mediaUrl?: string;
}) {
  const [a, b, accent] = design.palette;
  const ratio = design.size === "9:16" ? "9/16" : design.size === "16:9" ? "16/9" : design.size === "4:5" ? "4/5" : "1/1";
  const words = headline.split(/\s+/).filter(Boolean);
  return (
    <div
      className={`scene kind-${design.kind} ${design.kind === "animated" || design.kind === "video-style" || design.kind === "cinematic" ? "scene-anim" : ""}`}
      style={{ aspectRatio: ratio, background: `linear-gradient(150deg, ${a}, ${b})`, color: design.theme === "light" ? "#111" : "#fff" }}
    >
      {mediaUrl ? (
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
