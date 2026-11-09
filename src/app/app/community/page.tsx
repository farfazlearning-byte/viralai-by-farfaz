"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell, useLang, useMe } from "@/components/Shell";
import { DesignScene, Field, ErrBox } from "@/components/ui";
import { api } from "@/lib/client";
import { allDesigns, designById } from "@/lib/designs";

interface Post {
  id: number;
  user_id: number;
  poster_name: string;
  poster_founder: number | null;
  title: string;
  caption: string;
  allow_reuse: boolean;
  created_at: string;
  creative_id: number | null;
  design_key: string | null;
  headline: string | null;
  business: string | null;
  offer: string | null;
  creative_media_url: string | null;
  creative_media_kind: string | null;
  media_id: number | null;
  media_url: string | null;
  media_kind: string | null;
  like_count: number;
  share_count: number;
  liked_by_me: boolean;
}
interface Creative { id: number; title: string; headline: string; design_key: string }
interface MediaItem { id: number; kind: string; name: string; blob_url: string }

/** Never surface raw codes/JSON — map technical errors to a plain sentence. */
function friendly(raw: string, ta: boolean): string {
  if (/SETUP_PENDING|SERVER_ERROR|UNAUTHORIZED|OWNER_ONLY|HTTP \d|^\{|SyntaxError/i.test(raw)) {
    return ta
      ? "ஏதோ தடை ஏற்பட்டது — சிறிது நேரம் கழித்து மீண்டும் முயற்சியுங்கள்."
      : "Something interrupted that — please wait a moment and try again.";
  }
  return raw;
}

export default function CommunityPage() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const { me, loading } = useMe();
  const starter = useMemo(
    () => allDesigns().find((d) => d.familyKey === "clean-starter" && d.kind === "poster" && d.size === "1:1" && d.theme === "dark")!,
    [],
  );
  const [ready, setReady] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [source, setSource] = useState<"creative" | "video">("creative");
  const [creativeId, setCreativeId] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [allowReuse, setAllowReuse] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [shareBox, setShareBox] = useState<{ postId: number; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function refresh() {
    try {
      const d = await api("/api/community");
      setReady(Boolean(d.ready));
      setPosts((d.posts as Post[]) ?? []);
    } catch {
      setReady(false);
    }
    const cr = await api("/api/creatives").catch(() => ({ creatives: [] }));
    setCreatives((cr.creatives as Creative[]) ?? []);
    const m = await api("/api/media").catch(() => ({ media: [] }));
    setVideos(((m.media as MediaItem[]) ?? []).filter((x) => x.kind === "video"));
  }
  useEffect(() => {
    if (me) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  async function publish() {
    setErr(""); setMsg(""); setBusy(true);
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({
          action: "publish",
          title,
          caption,
          allowReuse,
          creativeId: source === "creative" && creativeId ? Number(creativeId) : null,
          mediaId: source === "video" && mediaId ? Number(mediaId) : null,
        }),
      });
      setPosts((d.posts as Post[]) ?? []);
      setTitle(""); setCaption(""); setAllowReuse(false);
      setMsg(ta ? "வெளியிடப்பட்டது — உங்கள் பதிவு ஊட்டத்தில் உள்ளது." : "Published — your post is in the feed below.");
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    } finally {
      setBusy(false);
    }
  }

  async function toggleLike(p: Post) {
    setErr("");
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "like", postId: p.id }),
      });
      setPosts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, liked_by_me: Boolean(d.liked), like_count: Number(d.likeCount ?? x.like_count) } : x)),
      );
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  async function share(p: Post) {
    setErr(""); setCopied(false);
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "share", postId: p.id }),
      });
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, share_count: Number(d.shareCount ?? x.share_count) } : x)));
      setShareBox({ postId: p.id, text: String(ta ? d.ta : d.en) });
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  async function unpublish(p: Post) {
    setErr("");
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "unpublish", postId: p.id }),
      });
      setPosts((d.posts as Post[]) ?? []);
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  function reuseCreative(p: Post) {
    if (p.design_key) {
      try { sessionStorage.setItem("viralai_template", p.design_key); } catch { /* private mode */ }
      window.location.href = "/app/studio";
    }
  }

  function reuseVideo(p: Post) {
    try {
      sessionStorage.setItem("viralai_template", "clean-starter:video-style:9:16:dark");
      if (p.media_id) sessionStorage.setItem("viralai_media", String(p.media_id));
    } catch { /* private mode */ }
    window.location.href = "/app/studio";
  }

  if (!loading && !me) {
    return (
      <AppShell>
        <h1>👥 {ta ? "சமூகம்" : "Community"}</h1>
        <div className="card">
          <p>{ta ? "சமூக ஊட்டத்தைப் பார்க்கவும் பதிவிடவும் உள்நுழையுங்கள்." : "Please sign in to see and post in the community feed."}</p>
          <Link className="btn primary" href="/auth">{ta ? "உள்நுழைக" : "Sign in"}</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1>👥 {ta ? "சமூகம்" : "Community"}</h1>
      <p className="muted">
        {ta
          ? "உறுப்பினர்கள் தங்கள் சொந்த designs மற்றும் வீடியோக்களை இங்கே பகிர்கிறார்கள். Like, share — எண்ணிக்கைகள் எல்லாம் உண்மையான பதிவுகளிலிருந்து மட்டுமே."
          : "Members share their own designs and videos here. Likes and shares — every count comes from real records only."}
      </p>
      <ErrBox msg={err} />
      {msg ? <p className="okbox">{msg}</p> : null}

      {ready === false ? (
        <div className="card">
          <p>{ta ? "சமூகப் பகுதி அமைக்கப்படுகிறது — சிறிது நேரத்தில் மீண்டும் பாருங்கள்." : "The community area is being set up — please look again in a little while."}</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>{ta ? "ஊட்டத்தில் வெளியிடு" : "Publish to the feed"}</h2>
            <div className="row">
              <button className={`btn small ${source === "creative" ? "primary" : ""}`} onClick={() => setSource("creative")}>
                {ta ? "என் creative" : "My creative"}
              </button>
              <button className={`btn small ${source === "video" ? "primary" : ""}`} onClick={() => setSource("video")}>
                {ta ? "என் வீடியோ" : "My video"}
              </button>
            </div>
            {source === "creative" ? (
              <Field label={ta ? "Creative-ஐத் தேர்ந்தெடு" : "Choose a creative"}>
                <select value={creativeId} onChange={(e) => setCreativeId(e.target.value)}>
                  <option value="">{ta ? "— தேர்ந்தெடு —" : "— choose —"}</option>
                  {creatives.map((c) => (
                    <option key={c.id} value={c.id}>{c.title || c.headline || `#${c.id}`}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label={ta ? "வீடியோவைத் தேர்ந்தெடு (My Media)" : "Choose a video (My Media)"}>
                <select value={mediaId} onChange={(e) => setMediaId(e.target.value)}>
                  <option value="">{ta ? "— தேர்ந்தெடு —" : "— choose —"}</option>
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={ta ? "தலைப்பு (தேவை)" : "Title (required)"}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </Field>
            <Field label={ta ? "விளக்கம் (விருப்பம்)" : "Caption (optional)"}>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} maxLength={1000} />
            </Field>
            <label className="row" style={{ alignItems: "flex-start", gap: 8 }}>
              <input type="checkbox" checked={allowReuse} onChange={(e) => setAllowReuse(e.target.checked)} />
              <span className="small">
                {ta
                  ? "மற்றவர்கள் இந்த design-ஐப் பயன்படுத்த அனுமதி — அணைத்து (off) என்றால் யாரும் அதை மீண்டும் பயன்படுத்த முடியாது."
                  : "Allow others to reuse this design — when off, nobody can reuse it."}
              </span>
            </label>
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn primary" disabled={busy} onClick={publish}>
                {ta ? "வெளியிடு" : "Publish"}
              </button>
            </div>
          </div>

          {ready === null ? (
            <p className="muted">{ta ? "ஏற்றுகிறது…" : "Loading…"}</p>
          ) : posts.length === 0 ? (
            <div className="card">
              <p className="muted">{ta ? "இன்னும் பதிவுகள் இல்லை — முதலில் வெளியிடுங்கள்!" : "No posts yet — be the first to publish!"}</p>
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
              {posts.map((p) => {
                const design = (p.design_key && designById(p.design_key)) || starter;
                const isMine = me && Number(p.user_id) === me.id;
                return (
                  <div className="card holo" key={p.id}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span className="small">
                        <b>{p.poster_name}</b>
                        {p.poster_founder ? <span className="badge live">🏆 Founder #{p.poster_founder}</span> : null}
                      </span>
                      {isMine ? <span className="badge">{ta ? "உங்கள் பதிவு" : "Your post"}</span> : null}
                    </div>
                    <h3 style={{ margin: "8px 0 4px" }}>{p.title}</h3>
                    {p.caption ? <p className="small" style={{ whiteSpace: "pre-wrap" }}>{p.caption}</p> : null}
                    {p.creative_id ? (
                      <DesignScene
                        design={design}
                        headline={p.headline || p.title}
                        offer={p.offer ?? ""}
                        business={p.business ?? ""}
                        lang={lang}
                        mediaUrl={p.creative_media_url ?? undefined}
                        mediaKind={p.creative_media_kind ?? undefined}
                      />
                    ) : p.media_url ? (
                      <video
                        src={p.media_url}
                        controls
                        playsInline
                        preload="metadata"
                        style={{ width: "100%", borderRadius: 10, display: "block" }}
                      />
                    ) : null}
                    <div className="row" style={{ marginTop: 10 }}>
                      <button className={`btn small ${p.liked_by_me ? "primary" : ""}`} onClick={() => toggleLike(p)}>
                        {p.liked_by_me ? "❤️" : "🤍"} {ta ? "Like" : "Like"} · {p.like_count}
                      </button>
                      <button className="btn small" onClick={() => share(p)}>
                        📤 {ta ? "பகிர்" : "Share"} · {p.share_count}
                      </button>
                      {isMine ? (
                        <button className="btn small" onClick={() => unpublish(p)}>
                          {ta ? "நீக்கு" : "Remove"}
                        </button>
                      ) : null}
                    </div>
                    {shareBox && shareBox.postId === p.id ? (
                      <div style={{ marginTop: 8 }}>
                        <textarea readOnly rows={3} value={shareBox.text} style={{ width: "100%" }} />
                        <div className="row">
                          <button
                            className="btn small"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(shareBox.text);
                                setCopied(true);
                              } catch { /* clipboard unavailable — text is selectable */ }
                            }}
                          >
                            {copied ? (ta ? "நகலெடுக்கப்பட்டது ✓" : "Copied ✓") : ta ? "நகலெடு" : "Copy"}
                          </button>
                          <span className="small muted">{ta ? "இந்த copy-இல் உங்கள் சொந்த அழைப்புக் குறியீடு உள்ளது." : "This copy carries your own invite code."}</span>
                        </div>
                      </div>
                    ) : null}
                    {p.creative_id ? (
                      p.allow_reuse ? (
                        <div className="row" style={{ marginTop: 8 }}>
                          <button className="btn small primary" onClick={() => reuseCreative(p)}>
                            {ta ? "இந்த design-ஐப் பயன்படுத்து" : "Use this design"}
                          </button>
                        </div>
                      ) : (
                        <p className="small muted" style={{ marginTop: 8 }}>
                          {ta ? "இந்த design-ஐ மீண்டும் பயன்படுத்த உரிமையாளர் அனுமதிக்கவில்லை." : "The owner hasn't allowed reuse of this design."}
                        </p>
                      )
                    ) : p.media_id ? (
                      p.allow_reuse ? (
                        <div className="row" style={{ marginTop: 8 }}>
                          <button className="btn small primary" onClick={() => reuseVideo(p)}>
                            {ta ? "இந்த வீடியோவைப் பயன்படுத்து" : "Use this video"}
                          </button>
                        </div>
                      ) : (
                        <p className="small muted" style={{ marginTop: 8 }}>
                          {ta ? "இந்த வீடியோவை மீண்டும் பயன்படுத்த உரிமையாளர் அனுமதிக்கவில்லை." : "The owner hasn't allowed reuse of this video."}
                        </p>
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
